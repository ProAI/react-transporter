import createRequest from '../request/createRequest';
import createReducer from '../reducers';

export default class Client {
  constructor(config) {
    this.network = config.network;
    this.initialData = config.initialData;
  }

  middleware() {
    return () => next => (action) => {
      if (action.type === 'TRANSPORTER_QUERY' || action.type === 'TRANSPORTER_MUTATION') {
        return next(createRequest(action, this.network.fetch));
      }

      return next(action);
    };
  }

  // eslint-disable-next-line class-methods-use-this
  reducer() {
    const roots = this.initialData && this.initialData.roots ? this.initialData.roots : {};
    const entities = this.initialData && this.initialData.entities ? this.initialData.entities : {};

    return createReducer(roots, entities);
  }

  getConfig() {
    return this.config;
  }
}
