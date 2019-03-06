export default class TransporterError extends Error {
  constructor(type, message, data) {
    super(message);

    this.name = 'TransporterError';
    this.type = type;
    this.data = data;
  }
}
