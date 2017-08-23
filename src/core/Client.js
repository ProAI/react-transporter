import createRequest from '../request/createRequest';

export default class Client {
  constructor(config) {
    this.network = config.network;
  }

  createMiddleware() {
    return () => next => (action) => {
      if (action.type === 'TRANSPORTER_QUERY' || action.type === 'TRANSPORTER_MUTATION') {
        return next(createRequest(action, this.network.fetch));
      }

      return next(action);
    };
  }

  getConfig() {
    return this.config;
  }
}
