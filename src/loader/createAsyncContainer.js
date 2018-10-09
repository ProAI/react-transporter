import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import AsyncManager from './AsyncManager';
import enhanceWithConnect from './utils/enhanceWithConnect';

const getTimestamp = () => new Date().getTime();

const resolveES6 = x =>
  (x != null && (typeof x === 'function' || typeof x === 'object') && x.default ? x.default : x);

const defaultAsyncOptions = {
  disabled: false,
  defer: true,
  error: null,
  loading: null,
};

const getAsyncOptions = (options) => {
  if (options && options.async) {
    return Object.assign({}, defaultAsyncOptions, options.async);
  }

  return defaultAsyncOptions;
};

const contextTypes = {
  store: PropTypes.object,
  isInBoundary: PropTypes.bool,
};

const childContextTypes = {
  isInBoundary: PropTypes.bool,
};

export default function createAsyncComponent(component, makeConfig, customOptions) {
  const options = {
    middleware: (customOptions && customOptions.middleware) || null,
    async: getAsyncOptions(customOptions),
  };

  const getConfig = (props) => {
    // TODO memoize this function
    const tempConfig = makeConfig(props);

    return {
      ...tempConfig,
      loaders: tempConfig.loaders || {},
    };
  };

  const hasCodeSplit = component.name && component.bundle;
  const name = component.displayName || component.name || 'Component';

  class Container extends React.Component {
    constructor(props, context) {
      super(props, context);

      const config = getConfig(this.props);
      const isPreload = this.isPreload();

      if (context.isInBoundary && !options.async.defer) {
        // eslint-disable-next-line no-console
        console.warn('Option "defer" is set to false inside a boundary.');
      }

      // Set phase
      this.phase = AsyncManager.getPhase();

      // Set unmounted to false
      this.hasUnmounted = false;

      // Set containerName
      if (isPreload) {
        this.containerName = `${name}-${AsyncManager.generateId(name)}`;
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
            loading: isPreload || hasCodeSplit ? 'block' : null,
            error: isPreload ? AsyncManager.getError(this.containerName, 'bundle') : null,
          },
        }
        : {};

      // Set resources loading & errors
      Object.keys(config.loaders).forEach((key) => {
        initialState[key] = {
          ...loaderState,
          loading: !isPreload ? 'block' : null,
          error: isPreload ? AsyncManager.getError(this.containerName, key) : null,
        };
      });

      // Set state
      this.state = {
        loaders: initialState,
        Component: !hasCodeSplit ? component : null,
      };

      // Set cache
      this.cache = {};

      // Bind load method
      this.handleLoad = this.handleLoad.bind(this);
    }

    getChildContext() {
      return { isInBoundary: options.async.boundary };
    }

    // eslint-disable-next-line react/sort-comp
    bootstrap() {
      const config = getConfig(this.props);
      const isPreload = this.isPreload();

      // We don't need to do something during bootstrapping if loading is deferred
      if (!isPreload) {
        return false;
      }

      const promises = [];

      // Load resources on server
      if (AsyncManager.getEnv() === 'node') {
        // Iterate over loaders to load resources initially
        Object.keys(config.loaders).forEach((key) => {
          const loader = config.loaders[key];
          const load = (promise) => {
            promises.push(this.handleLoad(key, promise, isPreload));
          };
          const cache = this.getCacheProvider();

          loader.request({ load, cache }, this.context.store.dispatch);
        });
      }

      // Load code bundle if present on server & client
      if (hasCodeSplit) {
        promises.push(this.handleLoad('bundle', component.bundle(), isPreload));
      }

      // Return composed promises and return false if this is a boundary
      return Promise.all(promises).then(() => !options.async.boundary);
    }

    componentDidMount() {
      const config = getConfig(this.props);
      const isPreload = this.isPreload();

      // We don't need to do something if resources were preloaded
      if (isPreload) {
        return;
      }

      // Iterate over loaders to load resources initially
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];
        const load = promise => this.handleLoad(key, promise, false);
        const cache = this.getCacheProvider();

        loader.request({ load, cache }, this.context.store.dispatch);
      });

      // Load code bundle if present on server & client
      if (hasCodeSplit && !this.state.Component) {
        this.handleLoad('bundle', component.bundle(), false);
      }
    }

    componentWillReceiveProps(nextProps, nextContext) {
      const config = getConfig(nextProps);

      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        // If a shouldUpdate function is defined, then we will check whether we need to reload the
        // resource or not.
        if (loader.shouldReload && !this.state.loaders[key].loading) {
          if (
            loader.shouldReload(
              {
                info: this.state.loaders[key],
                cache: this.getCacheProvider(),
              },
              nextProps,
              nextContext.store.getState(),
            )
          ) {
            this.setRequestState(key, 'block', null);

            const load = (promise, loadOptions) =>
              this.handleLoad(key, promise, false, loadOptions);
            const cache = this.getCacheProvider();

            loader.request({ load, cache }, this.context.store.dispatch);
          }
        }
      });
    }

    handleLoad(key, promise, isPreload) {
      return promise
        .then((result) => {
          // Save component if request was done for a component
          if (key === 'bundle') {
            this.state.Component = resolveES6(result);
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
            AsyncManager.addError(this.containerName, key, error);

            this.state.loaders[key].error = error;
          }
        });
    }

    componentWillUnmount() {
      this.hasUnmounted = true;
    }

    getCacheProvider() {
      return {
        get: cacheKey => this.cache[cacheKey],
        set: (cacheKey, cacheValue) => {
          this.cache[cacheKey] = cacheValue;
        },
      };
    }

    setRequestState(key, loading, error) {
      // Set loading and errors state. For start and end time we assume that if updatedLoading is
      // true, a new request will begin and if updatedLoading is false, a request will end.
      const time = getTimestamp();

      this.setState(state => ({
        loaders: {
          ...state.loaders,
          [key]: {
            startTime: loading ? time : state.loaders[key].startTime,
            endTime: !loading ? time : state.loaders[key].endTime,
            loading,
            error: error === undefined ? state.loaders[key].error : error,
          },
        },
      }));
    }

    isPreload() {
      const defer =
        !AsyncManager.isSSREnabled() || this.context.isInBoundary || options.async.defer;

      return !defer && (this.phase === 'BOOTSTRAPPING' || this.phase === 'FIRST_RENDER');
    }

    render() {
      const config = getConfig(this.props);

      // Create loader props
      const loaderProps = {};
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        if (loader.props) {
          const load = (promise, loadOptions) => {
            if (this.state.loaders[key].loading) {
              // eslint-disable-next-line no-console
              console.error(`Resource ${name} ${key} is already loading.`);
            } else {
              // Start request
              this.setRequestState(
                key,
                loadOptions && loadOptions.showWhileLoading ? 'show' : 'block',
              );

              this.handleLoad(key, promise, false);
            }
          };
          const cache = this.getCacheProvider();

          loaderProps[key] = {
            ...this.state.loaders[key],
            ...loader.props({ load, cache }, this.context.store.dispatch),
          };
        }
      });

      // Some resources are loading
      if (Object.values(this.state.loaders).some(info => info.loading === 'block')) {
        if (!options.async.loading) {
          return null;
        }

        const LoadingComponent = options.async.loading;

        return <LoadingComponent {...loaderProps} {...this.props} />;
      }

      // Some resources have an error
      if (Object.values(this.state.loaders).some(info => info.error !== null)) {
        if (process.env.NODE_ENV !== 'production' && this.phase !== 'BOOTSTRAPPING') {
          const errors = {};

          Object.keys(this.state.loaders).forEach((key) => {
            if (this.state.loaders[key].error) {
              errors[key] = this.state.loaders[key].error;
            }
          });

          // eslint-disable-next-line no-console
          console.error(`Some loaders of component ${name} have errors:\n`, errors);
        }

        if (!options.async.error) {
          return null;
        }

        const ErrorComponent = options.async.error;

        return <ErrorComponent {...loaderProps} {...this.props} />;
      }

      const props = { ...loaderProps, ...this.props };
      const { Component } = this.state;

      // connect selectors and actions if present
      if (config.selectors || config.actions) {
        // TODO: cache function call to enhanceWithConnect in production
        const EnhancedComponent = enhanceWithConnect(Component);

        return (
          <EnhancedComponent selectors={config.selectors} actions={config.actions} props={props} />
        );
      }

      return <Component {...props} />;
    }
  }

  Container.displayName = `Load(${name})`;
  Container.contextTypes = contextTypes;
  Container.childContextTypes = childContextTypes;

  if (options.middleware) {
    const enhance = compose(...options.middleware);

    const EnhancedContainer = enhance(Container);

    return EnhancedContainer;
  }

  return Container;
}
