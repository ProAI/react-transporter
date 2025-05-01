import React, { createElement } from 'react';
import TransporterContext from '../TransporterContext';
import { isServer } from '../constants';
import createContainerHandler from './createContainerHandler';
import createComponentResolver from './createComponentResolver';
import ErrorBoundary from './ErrorBoundary';

export default function createContainer(config) {
  const { component, ...options } = config;

  if (!component) {
    throw new Error('You must define a container "component".');
  }

  const componentResolver = createComponentResolver(
    component,
    options.renderer,
  );

  const ContainerHandler = createContainerHandler(componentResolver, options);

  class Container extends React.Component {
    store;

    componentDidMount() {
      this.store.mount();
    }

    componentWillUnmount() {
      this.store.unmount();
    }

    renderContainer() {
      const { client } = this.context;

      const handler = <ContainerHandler {...this.props} />;

      // If SSR is disabled, we do not need to wrap the handler in Suspense.
      if (options.syncMode || (isServer && !client.ssr)) {
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
        componentResolver.resetOnError();
        this.store = client.createStore(parentStore, options.syncMode);
      }

      return (
        <TransporterContext.Provider value={{ client, store: this.store }}>
          {options.throwOnError ? (
            this.renderContainer()
          ) : (
            <ErrorBoundary
              fallbackRender={options.error}
              onReset={() => {
                componentResolver.resetOnError();
                this.store.resetAborted();
              }}
            >
              {this.renderContainer()}
            </ErrorBoundary>
          )}
        </TransporterContext.Provider>
      );
    }
  }

  Container.contextType = TransporterContext;

  const name = component.displayName || component.name;
  Container.displayName = name ? `Container(${name})` : 'Container';

  return Container;
}
