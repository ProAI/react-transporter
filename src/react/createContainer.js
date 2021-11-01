import { createElement } from 'react';
import { compose } from 'redux';
import Selector from './Selector';

export default function createComponent(Component, makeConfig, customOptions) {
  const options = {
    middleware: (customOptions && customOptions.middleware) || null,
  };

  function Container(props) {
    const config = makeConfig(props);

    if (!config.selectors) {
      return createElement(Component, props);
    }

    // Wrap component in selector component to get store data.
    return createElement(Selector, { selectors: config.selectors }, (data) =>
      createElement(Component, { ...data, ...props }),
    );
  }

  if (options.middleware) {
    const enhance = compose(...options.middleware);

    return enhance(Container);
  }

  return Container;
}
