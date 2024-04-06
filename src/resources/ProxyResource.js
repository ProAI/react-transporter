class ProxyResource {
  promise;

  constructor() {
    this.promise = new Promise(() => {});
  }

  read = () => {
    throw this.promise;
  };
}

export default ProxyResource;
