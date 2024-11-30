import DataSet from './DataSet';
import createRequest from './createRequest';
import applyUpdater from './applyUpdater';
import Resource from '../resources/Resource';

export default class MutationRequest {
  mutation;

  options;

  resource;

  constructor(client, mutation, options = {}) {
    this.mutation = mutation;
    this.options = options;

    const optimisticData = applyUpdater(
      client,
      options.optimisticUpdater,
      new DataSet(),
    );

    client.queries.forEach((query) => {
      query.addUpdate(optimisticData, true);
    });
    client.refresh();

    this.resource = new Resource(() =>
      createRequest(client.request, mutation, options.variables),
    );

    // Handle fulfilled and rejected promise
    this.resource.promise.then(
      (res) => {
        const data = applyUpdater(
          client,
          options.updater,
          new DataSet({ entities: res.data.entities }),
          res,
        );

        // Set result in client
        if (optimisticData) {
          client.queries.forEach((query) => {
            query.removeUpdate(optimisticData);
          });
        }
        client.queries.forEach((query) => {
          query.addUpdate(data);
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
            query.removeUpdate(optimisticData);
          });
          client.refresh();
        }
      },
    );
  }
}
