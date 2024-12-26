import DataSet from './DataSet';
import createRequest from './createRequest';
import applyUpdater from './applyUpdater';
import Resource from '../resources/Resource';
import MutationCache from './MutationCache';

export default class MutationRequest {
  ast;

  options;

  resource;

  cache;

  constructor(client, ast, options = {}) {
    this.ast = ast;
    this.options = options;

    const optimisticData = applyUpdater(
      client,
      options.optimisticUpdater,
      new DataSet(),
    );

    client.queries.forEach((query) => {
      query.cache.addUpdate(optimisticData, true);
    });
    client.refresh();

    this.resource = new Resource(() =>
      createRequest(client.request, ast, options.variables),
    );

    // Handle fulfilled and rejected promise
    this.resource.promise.then(
      (res) => {
        const data = new DataSet(res.data);

        // Create cache
        this.cache = new MutationCache(this, data);

        const updatedData = applyUpdater(
          client,
          options.updater,
          new DataSet({ entities: res.data.entities }), // Do not add roots to store.
          this.cache,
        );

        // Set result in client
        if (optimisticData) {
          client.queries.forEach((query) => {
            query.cache.removeUpdate(optimisticData);
          });
        }
        client.queries.forEach((query) => {
          query.cache.addUpdate(updatedData);
        });
        client.refresh();
      },
      (err) => {
        if (err.message) {
          // eslint-disable-next-line no-console
          console.error(`Mutation Error: ${err.message}`);
        }

        // Reset optimistic update in client
        if (optimisticData) {
          client.queries.forEach((query) => {
            query.cache.removeUpdate(optimisticData);
          });
          client.refresh();
        }
      },
    );
  }
}
