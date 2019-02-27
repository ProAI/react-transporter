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

export default ErrorHandlerInstance;
