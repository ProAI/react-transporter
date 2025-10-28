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

  shouldCacheResponse;

  resource;

  selectors = [];

  loading = false;

  aborted = false;

  mounted = false;

  interval = null;

  cache = null;

  constructor(client, ast, options = {}, shouldCacheResponse = false) {
    this.client = client;
    this.ast = ast;
    this.options = options;
    this.shouldCacheResponse = shouldCacheResponse;

    // Set response from cache or start a new request.
    this.handleRequest();
  }

  handleRequest = () => {
    const cachedResponse = this.client.cache[this.options.name];

    if (cachedResponse) {
      this.resource = new SyncResource(cachedResponse);
      this.handleResponse({ data: cachedResponse }, true);

      // Delete cache after first use, so that it is only used on first render.
      delete this.client.cache[this.options.name];
    } else {
      this.loading = true;

      // Do not start a request on server if SSR is disabled.
      if (isServer && !this.client.ssr) {
        this.resource = new ProxyResource();
      } else {
        this.resource = new Resource(() =>
          createRequest(this.client, this.ast, this.options.variables),
        );

        // Handle fulfilled and rejected promise
        this.resource.promise.then(
          (res) => {
            this.loading = false;

            // Store response on server side for hydration.
            if (isServer) {
              this.client.cache[this.options.name] = res;
            }

            this.handleResponse(res);
          },
          () => {
            this.loading = false;
            this.aborted = true;
          },
        );
      }
    }

    if (!isServer && this.options.refetchInterval) {
      this.interval = setInterval(() => {
        this.loading = true;

        const resource = new Resource(() =>
          createRequest(this.client, this.ast, this.options.variables),
        );

        if (!this.options.refetchIntervalInBackground) {
          this.resource = resource;
          this.cache = null;

          // Commit update
          this.client.refresh();
        }

        // Handle fulfilled and rejected promise
        resource.promise.then(
          (res) => {
            this.loading = false;

            if (this.options.refetchIntervalInBackground) {
              this.resource = resource;
            }

            this.handleResponse(res);
          },
          () => {
            this.loading = false;
            this.aborted = true;
          },
        );
      }, this.options.refetchInterval);
    }
  };

  handleResponse = (res, fromCache = false) => {
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
      this.client.queries.forEach((query) => {
        query.cache.addUpdate(updateData);
      });
    }

    // Add result to client
    if (this.shouldCacheResponse) {
      this.client.queries.set(this.options.name, this);
    }

    // Commit update
    if (!isServer && !fromCache) {
      this.client.refresh();
    }
  };

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
    if (this.shouldCacheResponse) {
      this.client.queries.delete(this.options.name);
    }
  };
}
/* eslint-enable */
