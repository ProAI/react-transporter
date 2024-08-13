import React, { cloneElement } from 'react';
import TransporterContext from '../TransporterContext';
import { isServer } from '../constants';
import ContainerHandler from './ContainerHandler';
import resolveComponent from './resolveComponent';

export default function createContainer(config) {
  const { component, ...options } = config;

  if (!component) {
    throw new Error(`You must define a container "component".`);
  }

  let resource;

  const wrappedComponent = () => {
    if (!resource) {
      resource = resolveComponent(component, options.renderer);
    }

    const resolvedComponent = resource.read();

    if (options.renderer) {
      return options.renderer(resolvedComponent);
    }

    return resolvedComponent;
  };

  class Container extends React.Component {
    store;

    constructor(props) {
      super(props);
      this.state = { error: null };
    }

    componentDidCatch(error, info) {
      // eslint-disable-next-line no-console
      console.error(error, info);
    }

    componentWillUnmount() {
      this.store.destroy();
    }

    renderContainer() {
      const { client } = this.context;
      const { error } = this.state;

      if (error) {
        return options.error && cloneElement(options.error, { error });
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
        <React.Suspense fallback={options.loading}>{handler}</React.Suspense>
      );
    }

    render() {
      const { client, store: parentStore } = this.context;

      if (!this.store) {
        this.store = client.createStore(parentStore);
      }

      return (
        <TransporterContext.Provider value={{ client, store: this.store }}>
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
