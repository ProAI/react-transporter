import LoadingError from '../LoadingError';

class ProxyResource {
  promise;

  constructor() {
    this.promise = new Promise(() => {});
  }

  read = () => {
    throw new LoadingError();
  };
}

export default ProxyResource;
