import { PENDING, REJECTED } from '../constants';

class ProxyResource {
  promise;

  status = PENDING;

  response;

  constructor() {
    this.promise = new Promise((_, reject) => {
      reject(new Error('Proxied resource.'));
      this.status = REJECTED;
    });
  }

  read = () => {
    switch (this.status) {
      case PENDING:
        throw this.promise;
      default:
        throw this.response;
    }
  };
}

export default ProxyResource;
