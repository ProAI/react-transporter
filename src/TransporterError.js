export default class TransporterError extends Error {
  type;

  constructor(message, { type, ...options }) {
    super(message, options);

    this.name = 'TransporterError';
    this.type = type;
  }
}
