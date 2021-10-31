import { compose } from 'redux';
import useLoaders from './hooks/useLoaders';

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

    const createElement = useLoaders(component, config, options);

    return createElement(props);
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
