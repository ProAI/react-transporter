import DataSet from './DataSet';
import QueryCache from './QueryCache';
import createRequest from './createRequest';
import { isServer } from '../constants';
import SyncResource from '../resources/SyncResource';
import ProxyResource from '../resources/ProxyResource';
import Resource from '../resources/Resource';

/* eslint-disable arrow-body-style */
export default class QueryRequest {
  store;

  ast;

  options;

  resource;

  selectors = [];

  loading = false;

  aborted = false;

  cache;

  constructor(store, ast, options = {}) {
    this.store = store;
    this.ast = ast;
    this.options = options;

    const handleResponse = (res) => {
      if (this.aborted) {
        return;
      }

      const data = new DataSet(res.data);

      // Update store data
      const updateData = new DataSet({ entities: data.entities });
      store.queries.forEach((q) => {
        q.addUpdate(updateData);
      });

      // Add result to store
      this.cache = new QueryCache(this, data);
      store.queries.set(this.options.name, this.cache);

      // Commit update
      store.refresh();
    };

    const { cache } = store;
    const cachedResponse = cache[this.options.name];

    // Set response from cache or start a new request.
    if (cachedResponse) {
      this.resource = new SyncResource(cachedResponse);
      handleResponse(cachedResponse);

      // Delete cache after first use, so that it is only used on first render.
      delete cache[this.options.name];
    } else {
      // Do not start a request on server if SSR is disabled.
      this.resource =
        !isServer || store.ssr
          ? new Resource(() =>
              createRequest(store.request, ast, options.variables),
            )
          : new ProxyResource();
      this.loading = true;

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

    // Delete resource from store
    this.store.queries.delete(this.options.name);
  };
}
/* eslint-enable */
