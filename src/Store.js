import QueryRequest from './network/QueryRequest';
import MutationRequest from './network/MutationRequest';
import StoreNode from './StoreNode';

/* eslint-disable arrow-body-style */
export default class Store {
  request;

  root;

  cache;

  queries;

  constructor({ request, cache, ssr }) {
    this.request = request;

    this.root = this.createNode(null);
    this.cache = cache;
    this.ssr = ssr;

    this.queries = new Map();
  }

  query = (query, options) => {
    return new QueryRequest(this, query, options);
  };

  createNode = (parent) => {
    return new StoreNode(parent, this.query);
  };

  mutate = (mutation, options) => {
    return new MutationRequest(this, mutation, options);
  };

  refresh = () => {
    this.root.refresh();
  };

  reset = () => {
    this.root.reset();
    this.queries = new Map();

    this.root.refresh();
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
