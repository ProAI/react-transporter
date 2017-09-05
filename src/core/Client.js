import createRequest from '../request/createRequest';
import reducer from '../reducers';

export default class Client {
  constructor(config) {
    this.network = config.network;
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
    return reducer;
  }

  getConfig() {
    return this.config;
  }
}
