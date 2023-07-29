import { PENDING, FULFILLED, REJECTED } from '../constants';

class Resource {
  promise;

  status = PENDING;

  response;

  constructor(createPromise, options = {}) {
    const { proxy = false } = options;

    if (proxy) {
      this.promise = new Promise((_, reject) => {
        reject(new Error('Proxied resource.'));
      });
    } else {
      this.promise = createPromise();

      this.promise.then(
        (res) => {
          this.status = FULFILLED;
          this.response = res;
        },
        (err) => {
          this.status = REJECTED;
          this.response = err;
        },
      );
    }
  }

  read = () => {
    switch (this.status) {
      case PENDING:
        throw this.promise;
      case REJECTED:
        throw this.response;
      default:
        return this.response;
    }
  };
}

Resource.all = (values) => {
  const promises = [];

  const result = values.map((resolve) => {
    try {
      return resolve();
    } catch (err) {
      if (err instanceof Promise) {
        return promises.push(err);
      }

      throw err;
    }
  });

  if (promises.length > 0) {
    throw Promise.all(promises);
  }

  return result;
};

export default Resource;
