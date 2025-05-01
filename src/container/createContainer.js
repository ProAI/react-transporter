import React, { useContext, useRef, useEffect, createElement } from 'react';
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

  function Container(props) {
    const { client, store: parentStore } = useContext(TransporterContext);
    const storeRef = useRef(null);

    if (!storeRef.current) {
      componentResolver.resetOnError();
      storeRef.current = client.createStore(parentStore, options.syncMode);
    }

    useEffect(() => {
      storeRef.current.mount();

      return () => {
        storeRef.current.unmount();
      };
    }, []);

    const handler = <ContainerHandler {...props} />;

    const container =
      options.syncMode || (isServer && !client.ssr) ? (
        handler
      ) : (
        <React.Suspense
          fallback={options.loading && createElement(options.loading)}
        >
          {handler}
        </React.Suspense>
      );

    return (
      <TransporterContext.Provider value={{ client, store: storeRef.current }}>
        {options.throwOnError ? (
          container
        ) : (
          <ErrorBoundary
            fallbackRender={options.error}
            onReset={() => {
              componentResolver.resetOnError();
              storeRef.current.resetAborted();
            }}
          >
            {container}
          </ErrorBoundary>
        )}
      </TransporterContext.Provider>
    );
  }

  const name = component.displayName || component.name;
  Container.displayName = name ? `Container(${name})` : 'Container';

  return Container;
}
