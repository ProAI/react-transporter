import { useRef, useContext, createElement } from 'react';
import { isServer } from '../constants';
import TransporterContext from '../TransporterContext';
import Resource from '../resources/Resource';

/* eslint-disable react/prop-types */
function ContainerHandler(props) {
  const { component, options, values } = props;

  const container = options.container || (() => null);

  const async = useRef(false);
  const { client, node } = useContext(TransporterContext);

  try {
    const [resolvedValues, Component] = Resource.all([
      () => container(node, values),
      () => component(),
    ]);

    if (options.waitForAll) {
      node.waitForAll();
    }

    return createElement(Component, resolvedValues);
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
    return options.error && createElement(options.error, { error });
  }
}
/* eslint-enable */

export default ContainerHandler;
