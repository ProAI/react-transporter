class ErrorHandler {
  callback = null;

  set(callback) {
    this.callback = callback;
  }

  handle(errors) {
    if (this.callback) {
      this.callback(errors);
    }
  }
}

const ErrorHandlerInstance = new ErrorHandler();

export function onError(callback) {
  ErrorHandlerInstance.set(callback);
}

export default ErrorHandlerInstance;
