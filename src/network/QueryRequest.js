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

  cache;

  constructor(client, ast, options = {}) {
    this.client = client;
    this.ast = ast;
    this.options = options;

    const handleResponse = (res) => {
      if (this.aborted) {
        return;
      }

      const data = new DataSet(res.data);

      // Update client data
      const updateData = new DataSet({ entities: data.entities });
      client.queries.forEach((q) => {
        q.addUpdate(updateData);
      });

      // Add result to client
      this.cache = new QueryCache(this, data);
      client.queries.set(this.options.name, this.cache);

      // Commit update
      client.refresh();
    };

    const { cache } = client;
    const cachedResponse = cache[this.options.name];

    // Set response from cache or start a new request.
    if (cachedResponse) {
      this.resource = new SyncResource(cachedResponse);
      handleResponse({ data: cachedResponse });

      // Delete cache after first use, so that it is only used on first render.
      delete cache[this.options.name];
    } else {
      // Do not start a request on server if SSR is disabled.
      if (isServer && !client.ssr) {
        this.resource = new ProxyResource();
      } else {
        this.resource = new Resource(() =>
          createRequest(client.request, ast, options.variables),
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

      this.loading = true;
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

  sync = () => {
    if (this.loading || this.aborted) {
      return;
    }

    this.cache.commit();
  };

  invalidate = () => {
    this.aborted = true;

    // Delete resource from client
    this.client.queries.delete(this.options.name);
  };
}
/* eslint-enable */
