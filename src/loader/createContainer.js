import React from 'react';
import PropTypes from 'prop-types';
import AsyncManager from './AsyncManager';

const defaultOptions = {
  defer: true,
  boundary: false,
};

const defaultFallbacks = {
  loading: () => null,
  error: () => null,
};

const contextTypes = {
  store: PropTypes.object,
  isInBoundary: PropTypes.bool,
};

const childContextTypes = {
  isInBoundary: PropTypes.bool,
};

export default function createContainer(component, customConfig) {
  const config = {
    loaders: customConfig.loaders || {},
    fallbacks: Object.assign({}, defaultFallbacks, customConfig.fallbacks),
    options: Object.assign({}, defaultOptions, customConfig.options),
  };

  const hasCodeSplit = component.name && component.bundle;
  const name = component.displayName || component.name || 'Component';

  if (!component.displayName && !component.name) {
    // eslint-disable-next-line no-console
    console.warn('Loadable component has no name.');
  }

  const phase = AsyncManager.getPhase();
  const isServer = AsyncManager.getEnv() === 'node';

  const getComponent = () => AsyncManager.getComponent(name);
  const addComponent = module => AsyncManager.addComponent(name, module);

  const getError = (containerName, key) => AsyncManager.getError(containerName, key);
  const addError = (containerName, key, error) => AsyncManager.addError(containerName, key, error);

  const generateContainerName = () => `${name}-${AsyncManager.generateId(name)}`;

  class Container extends React.Component {
    constructor(props, context) {
      super(props, context);

      if (context.isInBoundary && !config.options.defer) {
        // eslint-disable-next-line no-console
        console.warn('Option "defer" is set to false inside a boundary.');
      }

      const defer = context.isInBoundary || config.options.defer;
      this.isPreload = !defer && (phase === 'BOOTSTRAPPING' || phase === 'FIRST_RENDER');

      // Set unmounted to false
      this.hasUnmounted = false;

      // Set containerName
      if (this.isPreload) {
        this.containerName = generateContainerName();
      }

      // Set bundle loading & errors
      const loading = hasCodeSplit
        ? {
          bundle: this.isPreload ? false : !getComponent(),
        }
        : {};
      const errors = hasCodeSplit
        ? {
          bundle: this.isPreload ? getError(this.containerName, 'bundle') : null,
        }
        : {};

      // Set resources loading & errors
      Object.keys(config.loaders).forEach((key) => {
        loading[key] = !this.isPreload ? 'block' : null;
        errors[key] = this.isPreload ? getError(this.containerName, key) : null;
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
      return { isInBoundary: config.options.boundary };
    }

    // eslint-disable-next-line react/sort-comp
    bootstrap() {
      // We don't need to do something during bootstrapping if loading is deferred
      if (!this.isPreload) {
        return false;
      }

      const promises = [];

      // Load resources on server
      if (isServer) {
        // Iterate over loaders to load resources initially
        Object.keys(config.loaders).forEach((key) => {
          const loader = config.loaders[key];

          loader.init((action, options) => {
            promises.push(this.load(key, action, options));
          });
        });
      }

      // Load code bundle if present on server & client
      if (hasCodeSplit) {
        promises.push(this.load('bundle', component.bundle));
      }

      // Return composed promises and return false if this is a boundary
      return Promise.all(promises).then(() => !config.options.boundary);
    }

    componentDidMount() {
      // We don't need to do something if resources were preloaded
      if (this.isPreload) {
        return;
      }

      // Iterate over loaders to load resources initially
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        loader.init((action, options) => this.load(key, action, options));
      });

      // Load code bundle if present on server & client
      if (hasCodeSplit && !getComponent()) {
        this.load('bundle', component.bundle);
      }
    }

    load(key, action, options = {}) {
      const promise = options.isReduxThunkAction ? this.context.store.dispatch(action) : action();

      return promise
        .then((result) => {
          // Save component if request was done for a component
          if (key === 'bundle') {
            addComponent(result);
          }

          // Update state if component did mount
          if (!this.isPreload && !this.hasUnmounted) {
            this.setRequestState(key, null, null);
          }
        })
        .catch((error) => {
          // Update state if component did mount
          if (!this.isPreload) {
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

    render() {
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

                this.load(key, action, options);
              }
            }),
          };
        }
      });

      // Some resources are loading
      if (Object.values(this.state.loading).some(element => element === 'block')) {
        const LoadingComponent = config.fallbacks.loading;

        return <LoadingComponent {...loaderProps} {...this.props} />;
      }

      // Some resources have an error
      if (Object.keys(this.state.errors).some(element => element === null)) {
        const ErrorComponent = config.fallbacks.error;

        return <ErrorComponent {...loaderProps} {...this.props} />;
      }

      const Component = hasCodeSplit ? getComponent() : component;

      return <Component {...loaderProps} {...this.props} />;
    }
  }

  Container.contextTypes = contextTypes;
  Container.childContextTypes = childContextTypes;

  return Container;
}
