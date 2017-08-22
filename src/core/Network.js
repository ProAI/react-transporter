class Network {
  constructor(request) {
    this.request = request;
  }

  fetch(schema, variables) {
    return this.request(schema, variables);
  }
}

export default Network;
