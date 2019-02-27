import ErrorHandler from './ErrorHandler';

export default function onError(callback) {
  ErrorHandler.set(callback);
}
