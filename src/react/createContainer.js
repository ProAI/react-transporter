import { createElement } from 'react';
import { compose } from 'redux';
import useBulkSelector from './hooks/useBulkSelector';

export default function createComponent(Component, makeConfig, customOptions) {
  const options = {
    middleware: (customOptions && customOptions.middleware) || null,
  };

  function Container(props) {
    const config = makeConfig(props);

    const selectorProps = useBulkSelector('RESOLVED', config.selectors);
    const elementProps = { ...selectorProps, ...props };

    return createElement(Component, elementProps);
  }

  if (options.middleware) {
    const enhance = compose(...options.middleware);

    return enhance(Container);
  }

  return Container;
}
