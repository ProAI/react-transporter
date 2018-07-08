import React from 'react';
import PropTypes from 'prop-types';
import AsyncManager from './AsyncManager';
import enhance from './utils/enhance';

const defaultOptions = {
  defer: true,
  boundary: false,
};

const getTimestamp = () => new Date().getTime();

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

  const getPhase = () => AsyncManager.getPhase();
  const isServer = AsyncManager.getEnv() === 'node';

  // init component statics
  const Component = !hasCodeSplit ? component : null;
  const EnhancedComponent = !hasCodeSplit ? enhance(component) : null;

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

      const loaderState = {
        startTime: !isPreload ? getTimestamp() : null,
        endTime: null,
      };

      // Set bundle loading & errors
      const initialState = hasCodeSplit
        ? {
          bundle: {
            ...loaderState,
            loading: isPreload || Container.Component ? null : 'block',
            error: isPreload ? getError(this.containerName, 'bundle') : null,
          },
        }
        : {};

      // Set resources loading & errors
      Object.keys(config.loaders).forEach((key) => {
        initialState[key] = {
          ...loaderState,
          loading: !isPreload ? 'block' : null,
          error: isPreload ? getError(this.containerName, key) : null,
        };
      });

      // Set state
      this.state = initialState;

      // Bind load method
      this.handleLoad = this.handleLoad.bind(this);
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
          const load = (promise) => {
            promises.push(this.handleLoad(key, promise, isPreload));
          };

          loader.request(load, this.context.store.dispatch);
        });
      }

      // Load code bundle if present on server & client
      if (hasCodeSplit) {
        promises.push(this.handleLoad('bundle', component.bundle(), isPreload));
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
        const load = promise => this.handleLoad(key, promise, false);

        loader.request(load, this.context.store.dispatch);
      });

      // Load code bundle if present on server & client
      if (hasCodeSplit && !Container.Component) {
        this.handleLoad('bundle', component.bundle(), false);
      }
    }

    componentWillReceiveProps(nextProps, nextContext) {
      const config = this.getConfig();

      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        // If a shouldUpdate function is defined, then we will check whether we need to reload the
        // resource or not.
        if (loader.shouldUpdate && !this.state[key].loading) {
          if (loader.shouldUpdate(this.state[key], nextProps, nextContext.store.getState())) {
            this.setRequestState(key, 'block', null);

            const load = (promise, options) => this.handleLoad(key, promise, false, options);
            loader.request(load, this.context.store.dispatch);
          }
        }
      });
    }

    handleLoad(key, promise, isPreload) {
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

            this.state[key].error = error;
          }
        });
    }

    componentWillUnmount() {
      this.hasUnmounted = true;
    }

    setRequestState(key, loading, error) {
      // Set loading and errors state. For start and end time we assume that if updatedLoading is
      // true, a new request will begin and if updatedLoading is false, a request will end.
      const time = getTimestamp();

      this.setState(state => ({
        [key]: {
          startTime: loading ? time : state[key].startTime,
          endTime: !loading ? time : state[key].endTime,
          loading,
          error: error === undefined ? state[key].error : error,
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
        fallbacks: tempConfig.fallbacks || {},
        options: Object.assign({}, defaultOptions, tempConfig.options),
      };
    }

    isPreload(config) {
      const phase = getPhase();
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
          const load = (promise, options) => {
            if (this.state.loading[key]) {
              // eslint-disable-next-line no-console
              console.error(`Resource ${name} ${key} is already loading.`);
            } else {
              // Start request
              this.setRequestState(key, options && options.showWhileLoading ? 'show' : 'block');

              this.handleLoad(key, promise, false);
            }
          };

          loaderProps[key] = {
            ...this.state[key],
            ...loader.props(load, this.context.store.dispatch),
          };
        }
      });

      // Some resources are loading
      if (Object.values(this.state).some(info => info.loading === 'block')) {
        if (!config.fallbacks.Loading) {
          return null;
        }

        const LoadingComponent = config.fallbacks.Loading;

        return <LoadingComponent {...loaderProps} {...this.props} />;
      }

      // Some resources have an error
      if (Object.values(this.state).some(info => info.error !== null)) {
        if (process.env.NODE_ENV !== 'production' && getPhase() !== 'BOOTSTRAPPING') {
          const errors = {};
          Object.keys(this.state).forEach((key) => {
            if (this.state[key].error) {
              errors[key] = this.state[key].error;
            }
          });

          // eslint-disable-next-line no-console
          console.error(`Some loaders of component ${name} have errors:\n`, errors);
        }

        if (!config.fallbacks.Error) {
          return null;
        }

        const ErrorComponent = config.fallbacks.Error;

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
