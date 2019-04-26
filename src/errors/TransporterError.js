export default class TransporterError extends Error {
  constructor(type, message, data, code) {
    super(message);

    this.name = 'TransporterError';
    this.type = type;
    this.data = data;
    this.code = code;
  }
}
