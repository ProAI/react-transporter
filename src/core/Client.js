import Transporter from './Transporter';

class Client {
  config = null;

  constructor(config) {
    this.config = config;
  }

  // createMiddleware() {
  // TODO
  // }

  getConfig() {
    return this.config;
  }
}

export default Client;
