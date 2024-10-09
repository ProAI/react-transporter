class LoadingError extends Error {
  constructor() {
    super('Loading proxy resource.');
    this.name = 'LoadingError';
  }
}

export default LoadingError;
