import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { compose } from 'redux';
import { useStore } from 'react-redux';
import enhanceWithConnect from './utils/enhanceWithConnect';
import useCache from './hooks/useCache';
import useRequestState from './hooks/useRequestState';

const resolveES6 = (x) =>
  x != null && (typeof x === 'function' || typeof x === 'object') && x.default
    ? x.default
    : x;

const defaultAsyncOptions = {
  disabled: false,
  defer: true,
  error: null,
  loading: null,
};

const getAsyncOptions = (options) => {
  if (options && options.async) {
    return { ...defaultAsyncOptions, ...options.async };
  }

  return defaultAsyncOptions;
};

export default function createAsyncComponent(
  component,
  makeConfig,
  customOptions,
) {
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

  function Container(props) {
    /* 1) Constructor */

    const store = useStore();
    const config = useMemo(() => getConfig(props), []);
    const unmounted = useRef(false);
    // const defer = true;
    const cache = useCache();

    // Set state
    const [state, setRequestState] = useRequestState(config, hasCodeSplit);

    // Set component
    const resolvedComponent = useMemo(
      () => ({
        Component: !hasCodeSplit ? component : null,
        isConnected: false,
      }),
      [],
    );

    // Define setRequestState

    // Define load method
    const handleLoad = useCallback(
      (key, promise) =>
        promise
          .then((result) => {
            // Save component if request was done for a component
            if (key === 'bundle') {
              resolvedComponent.Component = resolveES6(result);
            }

            // Update state if component did mount
            if (!unmounted.current) {
              setRequestState(key, null, null);
            }
          })
          .catch((error) => {
            // Update state if component did mount
            if (!unmounted.current) {
              setRequestState(key, null, error);
            }
          }),
      [],
    );

    /* 2) Lifecycles */

    useEffect(() => {
      // Iterate over loaders to load resources initially
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];
        const load = (promise) => handleLoad(key, promise, false);

        loader.request({ load, cache }, store.dispatch);
      });

      // Load code bundle if present on server & client
      if (hasCodeSplit && !resolvedComponent.Component) {
        handleLoad('bundle', component.bundle(), false);
      }

      return () => {
        unmounted.current = true;
      };
    }, []);

    useEffect(() => {
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        // If a shouldUpdate function is defined, then we will check whether we need to reload the
        // resource or not.
        if (loader.shouldReload && !state.loaders[key].loading) {
          if (
            loader.shouldReload(
              { info: state.loaders[key], cache },
              props,
              store.getState(),
            )
          ) {
            setRequestState(key, 'block', null);

            const load = (promise, loadOptions) =>
              handleLoad(key, promise, false, loadOptions);

            loader.request({ load, cache }, store.dispatch);
          }
        }
      });
    });

    /* 3) Render */

    // Create loader props
    const loaderProps = {};
    Object.keys(config.loaders).forEach((key) => {
      const loader = config.loaders[key];

      if (loader.props) {
        const load = (promise, loadOptions) => {
          if (state.loaders[key].loading) {
            // eslint-disable-next-line no-console
            console.error(`Resource ${name} ${key} is already loading.`);
          } else {
            // Start request
            setRequestState(
              key,
              loadOptions && loadOptions.showWhileLoading ? 'show' : 'block',
            );

            handleLoad(key, promise, false);
          }
        };

        loaderProps[key] = {
          ...state.loaders[key],
          ...loader.props({ load, cache }, store.dispatch),
        };
      }
    });

    // Some resources are loading
    if (Object.values(state.loaders).some((info) => info.loading === 'block')) {
      if (!options.async.loading) {
        return null;
      }

      const LoadingComponent = options.async.loading;

      return <LoadingComponent {...loaderProps} {...props} />;
    }

    // Some resources have an error
    if (Object.values(state.loaders).some((info) => info.error !== null)) {
      if (process.env.NODE_ENV === 'development') {
        const errors = {};

        Object.keys(state.loaders).forEach((key) => {
          if (state.loaders[key].error) {
            errors[key] = state.loaders[key].error;
          }
        });

        // eslint-disable-next-line no-console
        console.error(
          `Some loaders of component ${name} have errors:\n`,
          errors,
        );
      }

      if (!options.async.error) {
        return null;
      }

      const ErrorComponent = options.async.error;

      return <ErrorComponent {...loaderProps} {...props} />;
    }

    // connect selectors and actions if present
    if (config.selectors || config.actions) {
      if (!resolvedComponent.isConnected) {
        resolvedComponent.Component = enhanceWithConnect(
          resolvedComponent.Component,
        );
        resolvedComponent.isConnected = true;
      }

      const { Component } = resolvedComponent;
      return (
        <Component
          selectors={config.selectors}
          actions={config.actions}
          props={{ ...loaderProps, ...props }}
        />
      );
    }

    const { Component } = resolvedComponent;
    return <Component {...loaderProps} {...props} />;
  }

  Container.displayName = `Load(${name})`;

  if (options.middleware) {
    const enhance = compose(...options.middleware);

    const EnhancedContainer = enhance(Container);

    return EnhancedContainer;
  }

  return Container;
}
