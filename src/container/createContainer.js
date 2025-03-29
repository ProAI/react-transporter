import React, { createElement } from 'react';
import TransporterContext from '../TransporterContext';
import { isServer } from '../constants';
import createContainerHandler from './createContainerHandler';
import createComponentLoader from './createComponentLoader';

export default function createContainer(config) {
  const { component, ...options } = config;

  if (!component) {
    throw new Error('You must define a container "component".');
  }

  const componentLoader = createComponentLoader(component, options.renderer);
  const ContainerHandler = createContainerHandler(componentLoader, options);

  class Container extends React.Component {
    store;

    constructor(props) {
      super(props);
      this.state = { error: null };
    }

    componentDidMount() {
      this.store.mount();
    }

    componentDidCatch(error, info) {
      if (options.throwOnError) {
        return;
      }

      const { client } = this.context;

      client.onContainerError(error, info);
    }

    componentWillUnmount() {
      this.store.unmount();
    }

    renderContainer() {
      const { client } = this.context;
      const { error } = this.state;

      if (error) {
        const reset = () => {
          componentLoader.resetOnError();
          this.store.resetAborted();

          this.setState({ error: null });
        };

        return options.error && createElement(options.error, { error, reset });
      }

      const handler = <ContainerHandler {...this.props} />;

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
      const { client, store: parentStore } = this.context;

      if (!this.store) {
        componentLoader.resetOnError();
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
