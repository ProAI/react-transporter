class Transporter {
  client = null;

  setClient(client) {
    this.client = client;
  }

  fetch(query, variables) {
    return this.client.network.fetch(query, variables);
  }
}

// singleton
const TransporterInstance = new Transporter();

export default TransporterInstance;
