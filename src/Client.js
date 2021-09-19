import configureStore from './utils/configureStore';

export default class Client {
  constructor(config) {
    this.config = config;
    this.store = null;
  }

  buildStore() {
    if (this.store) {
      throw new Error('Store was built before.');
    }

    this.store = configureStore(this.config.initialData, this.config.network);

    return this.store;
  }

  getStore() {
    return this.store;
  }

  getConfig() {
    return this.config;
  }
}
