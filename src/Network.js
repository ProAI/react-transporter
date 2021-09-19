export default class Network {
  constructor(request) {
    this.request = request;
  }

  fetch = (query, variables) => this.request(query, variables);
}
