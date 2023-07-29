import React, { createElement } from 'react';
import { isWeb, isServer } from '../constants';
import TransporterContext from '../TransporterContext';
import Resource from '../resources/Resource';
import createMetaHandler from './createMetaHandler';

/* eslint-disable react/prop-types */
class ContainerHandler extends React.Component {
  meta;

  async = false;

  componentWillUnmount() {
    if (this.meta) {
      this.meta.destroy();
    }
  }

  render() {
    const {
      component,
      container = () => null,
      meta,
      options,
      values,
    } = this.props;
    const { client, node } = this.context;

    try {
      const [Component, resolvedValues] = Resource.all([
        () => component(),
        () => container(node, values),
      ]);

      // Handle meta data
      if (meta && isWeb && !isServer && !this.meta) {
        const metaData = meta({ ...values, ...resolvedValues });
        this.meta = createMetaHandler(metaData);
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

        if (!this.async) {
          this.async = true;
        }

        // Re-throw suspense resource
        throw error;
      }

      // If SSR is enabled and an error occured after loading an async
      // resource, we render the loading component, so that the resource will
      // be tried to load on the client again.
      if (client.ssr && this.async) {
        return options.loading && createElement(options.loading);
      }

      // Render error page for synchronous error.
      return options.error && createElement(options.error, { error });
    }
  }
}
/* eslint-enable */

ContainerHandler.contextType = TransporterContext;
ContainerHandler.displayName = ContainerHandler;

export default ContainerHandler;
