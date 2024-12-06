class HttpError extends Error {
  response;

  data;

  constructor(response, data) {
    super('Http error.');

    this.response = response;
    this.data = data;
    this.name = 'HttpError';
  }
}

export default HttpError;
