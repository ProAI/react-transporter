import QueryRequest from './network/QueryRequest';
import MutationRequest from './network/MutationRequest';
import Store from './Store';

/* eslint-disable arrow-body-style */
export default class Transporter {
  request;

  rootStore;

  cache;

  ssr;

  queries;

  constructor({ request, cache = {}, ssr = false }) {
    this.request = request;

    this.rootStore = this.createStore(null);
    this.cache = cache;
    this.ssr = ssr;

    this.queries = new Map();
  }

  query = (query, options) => {
    return new QueryRequest(this, query, options);
  };

  createStore = (parentStore) => {
    return new Store(parentStore, this.query);
  };

  mutate = (mutation, options) => {
    return new MutationRequest(this, mutation, options);
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
      data[key] = query.data.extract();
    });

    return data;
  };
}
/* eslint-enable */
