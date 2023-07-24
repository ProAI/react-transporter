import DataSet from './DataSet';
import createRequest from './createRequest';
import applyUpdater from './applyUpdater';
import Resource from '../resources/Resource';

export default class MutationRequest {
  mutation;

  options;

  resource;

  constructor(store, mutation, options = {}) {
    this.mutation = mutation;
    this.options = options;

    const optimisticData = applyUpdater(
      store,
      options.optimisticUpdater,
      new DataSet(),
    );

    store.queries.forEach((query) => {
      query.addUpdate(optimisticData, true);
    });
    store.refresh();

    this.resource = new Resource(() =>
      createRequest(store.request, mutation, options.variables),
    );

    // Handle fulfilled and rejected promise
    this.resource.promise.then(
      (res) => {
        const data = applyUpdater(
          store,
          options.updater,
          new DataSet({ entities: res.entities }),
        );

        // Set result in store
        if (optimisticData) {
          store.queries.forEach((query) => {
            query.removeUpdate(optimisticData);
          });
        }
        store.queries.forEach((query) => {
          query.addUpdate(data);
        });
        store.refresh();
      },
      (err) => {
        if (err.message) {
          // eslint-disable-next-line no-console
          console.error(`Mutation Error: ${err.message}`);
        }

        // Reset optimistic update in store
        if (optimisticData) {
          store.queries.forEach((query) => {
            query.removeUpdate(optimisticData);
          });
          store.refresh();
        }
      },
    );
  }
}
