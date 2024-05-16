import React, { createElement } from 'react';
import TransporterContext from '../TransporterContext';
import { isServer } from '../constants';
import ContainerHandler from './ContainerHandler';
import resolveComponent from './resolveComponent';

export default function createContainer(component, options) {
  let resource;

  const wrappedComponent = () => {
    if (!resource) {
      resource = resolveComponent(component, options);
    }

    return resource.read();
  };

  class Container extends React.Component {
    node;

    constructor(props) {
      super(props);
      this.state = { error: null };
    }

    componentDidCatch(error, info) {
      // eslint-disable-next-line no-console
      console.error(error, info);
    }

    componentWillUnmount() {
      this.node.destroy();
    }

    renderContainer() {
      const { client } = this.context;
      const { error } = this.state;

      if (error) {
        return options.error && createElement(options.error, { error });
      }

      const handler = (
        <ContainerHandler
          component={wrappedComponent}
          options={options}
          values={this.props}
        />
      );

      // If SSR is disabled, we do not need to wrap the handler in Suspense.
      if (isServer && !client.ssr) {
        return handler;
      }

      return (
        <React.Suspense
          fallback={options.loading && createElement(options.loading)}
        >
          {handler}
        </React.Suspense>
      );
    }

    render() {
      const { client, node: parent } = this.context;

      if (!this.node) {
        this.node = client.createNode(parent);
      }

      return (
        <TransporterContext.Provider value={{ client, node: this.node }}>
          {this.renderContainer()}
        </TransporterContext.Provider>
      );
    }
  }

  // Add error boundary if container should not throw.
  if (!options.throwOnError) {
    Container.getDerivedStateFromError = (error) => ({ error });
  }

  Container.contextType = TransporterContext;

  const name = component.displayName || component.name;
  Container.displayName = name ? `Container(${name})` : 'Container';

  return Container;
}
