class TransporterError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'TransporterError';
  }
}

export default TransporterError;
