import DataSet from './DataSet';
import QueryCache from './QueryCache';
import createRequest from './createRequest';
import { isServer } from '../constants';
import SyncResource from '../resources/SyncResource';
import ProxyResource from '../resources/ProxyResource';
import Resource from '../resources/Resource';

/* eslint-disable arrow-body-style */
export default class QueryRequest {
  client;

  ast;

  options;

  resource;

  selectors = [];

  loading = false;

  aborted = false;

  mounted = false;

  interval = null;

  cache = null;

  constructor(client, ast, options = {}) {
    this.client = client;
    this.ast = ast;
    this.options = options;

    const handleResponse = (res, fromCache = false) => {
      if (this.aborted) {
        return;
      }

      const data = new DataSet(res.data);

      // Create cache
      if (!this.cache) {
        this.cache = new QueryCache(this, data);
      }

      // Update client data
      if (!isServer && !fromCache) {
        const updateData = new DataSet({ entities: data.entities });
        client.queries.forEach((query) => {
          query.cache.addUpdate(updateData);
        });
      }

      // Add result to client
      client.queries.set(this.options.name, this);

      // Commit update
      if (!isServer && !fromCache) {
        client.refresh();
      }
    };

    const { cache } = client;
    const cachedResponse = cache[this.options.name];

    // Set response from cache or start a new request.
    if (cachedResponse) {
      this.resource = new SyncResource(cachedResponse);
      handleResponse({ data: cachedResponse }, true);

      // Delete cache after first use, so that it is only used on first render.
      delete cache[this.options.name];
    } else {
      this.loading = true;

      // Do not start a request on server if SSR is disabled.
      if (isServer && !client.ssr) {
        this.resource = new ProxyResource();
      } else {
        this.resource = new Resource(() =>
          createRequest(client, ast, options.variables),
        );

        // Handle fulfilled and rejected promise
        this.resource.promise.then(
          (res) => {
            this.loading = false;

            // Store response on server side for hydration.
            if (isServer) {
              cache[this.options.name] = res;
            }

            handleResponse(res);
          },
          () => {
            this.loading = false;
            this.aborted = true;
          },
        );
      }
    }

    if (!isServer && options.refetchInterval) {
      this.interval = setInterval(() => {
        this.loading = true;

        const resource = new Resource(() =>
          createRequest(client, ast, options.variables),
        );

        if (!options.refetchIntervalInBackground) {
          this.resource = resource;
          this.cache = null;

          // Commit update
          client.refresh();
        }

        // Handle fulfilled and rejected promise
        resource.promise.then(
          (res) => {
            this.loading = false;

            if (options.refetchIntervalInBackground) {
              this.resource = resource;
            }

            handleResponse(res);
          },
          () => {
            this.loading = false;
            this.aborted = true;
          },
        );
      }, options.refetchInterval);
    }
  }

  read = () => {
    this.resource.read();
  };

  isEqual = (ast, variables) => {
    return (
      this.ast === ast &&
      JSON.stringify(this.options.variables) === JSON.stringify(variables)
    );
  };

  isAborted = () => {
    return this.aborted;
  };

  sync = () => {
    if (this.loading || this.aborted) {
      return;
    }

    this.cache.commit();
  };

  mount = () => {
    this.mounted = true;
  };

  unmount = () => {
    this.mounted = false;
    this.aborted = true;

    // Clear interval
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Delete resource from client
    this.client.queries.delete(this.options.name);
  };
}
/* eslint-enable */
