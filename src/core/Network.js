export default class Network {
  constructor(request) {
    this.request = request;
  }

  fetch = (schema, variables) => this.request(schema, variables);
}
