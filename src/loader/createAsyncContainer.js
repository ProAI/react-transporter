import React from 'react';
import PropTypes from 'prop-types';
import AsyncManager from './AsyncManager';
import enhance from './utils/enhance';

const defaultOptions = {
  defer: true,
  boundary: false,
};

const defaultFallbacks = {
  Loading: () => null,
  Error: () => null,
};

const resolveES6 = x =>
  (x != null && (typeof x === 'function' || typeof x === 'object') && x.default ? x.default : x);

const contextTypes = {
  store: PropTypes.object,
  isInBoundary: PropTypes.bool,
};

const childContextTypes = {
  isInBoundary: PropTypes.bool,
};

export default function createAsyncContainer(component, customConfig) {
  const hasCodeSplit = component.name && component.bundle;
  const name = component.displayName || component.name || 'Component';

  if (!component.displayName && !component.name) {
    // eslint-disable-next-line no-console
    console.warn('Loadable component has no name.');
  }

  const phase = AsyncManager.getPhase();
  const isServer = AsyncManager.getEnv() === 'node';

  // init component statics
  const Component = !component.bundle ? component : null;
  const EnhancedComponent = !component.bundle ? enhance(component) : null;

  const getError = (containerName, key) => {
    const errors = AsyncManager.getError(containerName, key);

    if (!errors || Object.keys(errors).length === 0) {
      return null;
    }

    return errors;
  };
  const addError = (containerName, key, error) => AsyncManager.addError(containerName, key, error);

  const generateContainerName = () => `${name}-${AsyncManager.generateId(name)}`;

  class Container extends React.Component {
    constructor(props, context) {
      super(props, context);

      const config = this.getConfig();
      const isPreload = this.isPreload(config);

      if (context.isInBoundary && !config.options.defer) {
        // eslint-disable-next-line no-console
        console.warn('Option "defer" is set to false inside a boundary.');
      }

      // Set unmounted to false
      this.hasUnmounted = false;

      // Set containerName
      if (isPreload) {
        this.containerName = generateContainerName();
      }

      // Set bundle loading & errors
      const loading = hasCodeSplit
        ? {
          bundle: isPreload || Container.Component ? null : 'block',
        }
        : {};
      const errors = hasCodeSplit
        ? {
          bundle: isPreload ? getError(this.containerName, 'bundle') : null,
        }
        : {};

      // Set resources loading & errors
      Object.keys(config.loaders).forEach((key) => {
        loading[key] = !isPreload ? 'block' : null;
        errors[key] = isPreload ? getError(this.containerName, key) : null;
      });

      // Set state
      this.state = {
        loading,
        errors,
      };

      // Bind load method
      this.load = this.load.bind(this);
    }

    getChildContext() {
      return { isInBoundary: this.getConfig().options.boundary };
    }

    // eslint-disable-next-line react/sort-comp
    bootstrap() {
      const config = this.getConfig();
      const isPreload = this.isPreload(config);

      // We don't need to do something during bootstrapping if loading is deferred
      if (!isPreload) {
        return false;
      }

      const promises = [];

      // Load resources on server
      if (isServer) {
        // Iterate over loaders to load resources initially
        Object.keys(config.loaders).forEach((key) => {
          const loader = config.loaders[key];

          loader.init((action, options) => {
            promises.push(this.load(key, action, isPreload, options));
          });
        });
      }

      // Load code bundle if present on server & client
      if (hasCodeSplit) {
        promises.push(this.load('bundle', component.bundle, isPreload));
      }

      // Return composed promises and return false if this is a boundary
      return Promise.all(promises).then(() => !config.options.boundary);
    }

    componentDidMount() {
      const config = this.getConfig();
      const isPreload = this.isPreload(config);

      // We don't need to do something if resources were preloaded
      if (isPreload) {
        return;
      }

      // Iterate over loaders to load resources initially
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        loader.init((action, options) => this.load(key, action, isPreload, options));
      });

      // Load code bundle if present on server & client
      if (hasCodeSplit && !Container.Component) {
        this.load('bundle', component.bundle, isPreload);
      }
    }

    load(key, action, isPreload, options = {}) {
      const promise = options.isReduxThunkAction ? this.context.store.dispatch(action) : action();

      return promise
        .then((result) => {
          // Save component if request was done for a component
          if (key === 'bundle') {
            Container.Component = resolveES6(result);
            Container.EnhancedComponent = enhance(Container.Component);
          }

          // Update state if component did mount
          if (!isPreload && !this.hasUnmounted) {
            this.setRequestState(key, null, null);
          }
        })
        .catch((error) => {
          // Update state if component did mount
          if (!isPreload) {
            if (!this.hasUnmounted) {
              this.setRequestState(key, null, error);
            }
          } else {
            addError(this.containerName, key, error);

            this.state.errors[key] = error;
          }
        });
    }

    componentWillUnmount() {
      this.hasUnmounted = true;
    }

    setRequestState(key, updatedLoading, updatedError) {
      this.setState(({ loading, errors }) => ({
        loading: {
          ...loading,
          [key]: updatedLoading,
        },
        errors: {
          ...errors,
          [key]: updatedError === undefined ? errors[key] : updatedError,
        },
      }));
    }

    getConfig() {
      // TODO memoize this function
      const tempConfig =
        typeof customConfig === 'function' ? customConfig(this.props) : customConfig;

      return {
        ...tempConfig,
        loaders: tempConfig.loaders || {},
        fallbacks: Object.assign({}, defaultFallbacks, tempConfig.fallbacks),
        options: Object.assign({}, defaultOptions, tempConfig.options),
      };
    }

    isPreload(config) {
      const defer = this.context.isInBoundary || config.options.defer;

      return !defer && (phase === 'BOOTSTRAPPING' || phase === 'FIRST_RENDER');
    }

    render() {
      const config = this.getConfig();

      // Create loader props
      const loaderProps = {};
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        if (loader.props) {
          loaderProps[key] = {
            loading: !!this.state.loading[key],
            error: this.state.errors[key],
            ...loader.props((action, options) => {
              if (this.state.loading[key]) {
                // eslint-disable-next-line no-console
                console.error(`Resource ${name} ${key} is already loading.`);
              } else {
                this.setRequestState(key, options && options.showWhileLoading ? 'show' : 'block');

                this.load(key, action, false, options);
              }
            }),
          };
        }
      });

      // Some resources are loading
      if (Object.values(this.state.loading).some(element => element === 'block')) {
        const LoadingComponent = config.fallbacks.Loading;

        return <LoadingComponent {...loaderProps} {...this.props} />;
      }

      // Some resources have an error
      if (Object.values(this.state.errors).some(element => element !== null)) {
        const ErrorComponent = config.fallbacks.Error;

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error(`Some loaders of component ${name} have errors:\n`, this.state.errors);
        }

        return <ErrorComponent {...loaderProps} {...this.props} />;
      }

      const props = { ...loaderProps, ...this.props };

      // connect selectors and actions if present
      if (config.selectors || config.actions) {
        return (
          <Container.EnhancedComponent
            selectors={config.selectors}
            actions={config.actions}
            props={props}
          />
        );
      }

      return <Container.Component {...props} />;
    }
  }

  Container.displayName = `Load(${name})`;
  Container.contextTypes = contextTypes;
  Container.childContextTypes = childContextTypes;

  Container.Component = Component;
  Container.EnhancedComponent = EnhancedComponent;

  return Container;
}
