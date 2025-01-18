import { useRef, useContext, useSyncExternalStore, createElement } from 'react';
import { isServer } from '../constants';
import TransporterContext from '../TransporterContext';
import Resource from '../resources/Resource';
import LoadingError from '../LoadingError';

export default function createContainerHandler(componentLoader, options) {
  const loadData = options.data || (() => undefined);

  /* eslint-disable react/prop-types */
  function ContainerHandler(props) {
    const async = useRef(false);
    const { client, store } = useContext(TransporterContext);

    useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);

    try {
      const [resolvedProps, Component] = Resource.all([
        () => loadData(store, props),
        () => componentLoader.load(),
      ]);

      if (options.waitForAll) {
        store.waitForAll();
      }

      return createElement(Component, resolvedProps);
    } catch (error) {
      // If not on the server, errors will be handled by the error boundary.
      if (!isServer) {
        throw error;
      }

      // Error is not an error, but a suspense resource.
      if (error instanceof Promise) {
        // If SSR is disabled, we render the loading component, so that the
        // resource will be loaded on the client.
        if (!client.ssr) {
          return options.loading && createElement(options.loading);
        }

        if (!async.current) {
          async.current = true;
        }

        // Re-throw suspense resource
        throw error;
      }

      if (error instanceof LoadingError) {
        return options.loading && createElement(options.loading);
      }

      // If SSR is enabled and an error occured after loading an async
      // resource, we render the loading component, so that the resource will
      // be loaded on the client again.
      if (client.ssr && async.current) {
        return options.loading && createElement(options.loading);
      }

      // Re-throw error if container should throw.
      if (options.throwOnError) {
        throw error;
      }

      // Render error page for synchronous error.
      return (
        options.error &&
        createElement(options.error, {
          error,
          // Use noop for reset on server.
          reset: () => {},
          resetAll: () => {},
        })
      );
    }
  }
  /* eslint-enable */

  return ContainerHandler;
}
