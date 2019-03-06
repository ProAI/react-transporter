class ErrorHandler {
  static callback = null;

  static set(callback) {
    this.callback = callback;
  }

  static handle(errors) {
    if (this.callback) {
      this.callback(errors);
    }
  }
}

export function onError(callback) {
  ErrorHandler.set(callback);
}

export default ErrorHandler;
