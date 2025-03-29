import QueryRequest from './network/QueryRequest';
import MutationRequest from './network/MutationRequest';
import GraphQLError from './errors/GraphQLError';
import Store from './Store';

const handleResponse = (data) => {
  if (data.errors) {
    throw new GraphQLError(data.errors);
  }

  return data;
};

const handleContainerError = () => {
  // React already logs errors from error boundary, so we do not log the error here.
};

const handleDispatcherError = (error) => {
  // eslint-disable-next-line no-console
  console.error(`Request error: ${error.message}`);
};

/* eslint-disable arrow-body-style */
export default class Transporter {
  request;

  rootStore;

  cache;

  ssr;

  queries;

  constructor({
    request,
    onResponse = handleResponse,
    onContainerError = handleContainerError,
    onDispatcherError = handleDispatcherError,
    cache = {},
    ssr = false,
  }) {
    this.request = request;

    this.rootStore = this.createStore(null);
    this.onResponse = onResponse;
    this.onContainerError = onContainerError;
    this.onDispatcherError = onDispatcherError;
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

  createStore = (parentStore) => {
    return new Store(parentStore, this.query);
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
