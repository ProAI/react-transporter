import { createElement } from 'react';
import { compose } from 'redux';
import useLoaders from './hooks/useLoaders';
import Selector from './Selector';

const defaultAsyncOptions = {
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

  function AsyncContainer(props) {
    const config = getConfig(props);

    const [state, loaderProps] = useLoaders(component, config);
    const elementProps = { ...loaderProps, ...props };

    if (state.status === 'LOADING') {
      return createElement(options.async.loading, elementProps);
    }

    if (state.status === 'ERROR') {
      return createElement(options.async.error, elementProps);
    }

    if (!config.selectors) {
      return createElement(state.component, elementProps);
    }

    // Wrap component in selector component to get store data.
    return createElement(Selector, { selectors: config.selectors }, (data) =>
      createElement(state.component, { ...data, ...elementProps }),
    );
  }

  const name = component.displayName || component.name || 'Component';
  AsyncContainer.displayName = `Load(${name})`;

  if (options.middleware) {
    const enhance = compose(...options.middleware);

    const EnhancedContainer = enhance(AsyncContainer);

    return EnhancedContainer;
  }

  return AsyncContainer;
}
