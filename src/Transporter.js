import QueryRequest from './network/QueryRequest';
import MutationRequest from './network/MutationRequest';
import Store from './Store';

/* eslint-disable arrow-body-style */
export default class Transporter {
  request;

  rootStore;

  transformContainerError;

  createGraphQLErrorMessage;

  cache;

  ssr;

  queries;

  constructor({
    request,
    transformContainerError,
    createGraphQLErrorMessage,
    cache = {},
    ssr = false,
  }) {
    this.request = request;

    this.rootStore = this.createStore(null);
    this.transformContainerError = transformContainerError;
    this.createGraphQLErrorMessage = createGraphQLErrorMessage;
    this.cache = cache;
    this.ssr = ssr;

    this.queries = new Map();
  }

  query = (ast, options) => {
    const query = this.queries.get(options.name);

    // It might happen that a rerender occurs while initializing. In this case
    // we do not want to create a new query request and return the already
    // existing query request.
    if (query && !query.mounted) {
      return query;
    }

    return new QueryRequest(this, ast, options);
  };

  createStore = (parentStore, syncMode) => {
    return new Store(parentStore, this.query, syncMode);
  };

  mutate = (ast, options) => {
    return new MutationRequest(this, ast, options);
  };

  refresh = () => {
    this.rootStore.refresh();
  };

  reset = () => {
    this.rootStore.reset();
    this.queries = new Map();
  };

  extract = () => {
    const data = {};

    this.queries.forEach((query, key) => {
      data[key] = query.cache.data.extract();
    });

    return data;
  };
}
/* eslint-enable */
