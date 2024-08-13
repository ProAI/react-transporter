import SyncResource from '../resources/SyncResource';
import Resource from '../resources/Resource';
import { isServer, isWeb } from '../constants';

const isLoaded = (ctor) => {
  const key = ctor.resolve();

  // eslint-disable-next-line no-underscore-dangle, camelcase
  if (typeof __webpack_modules__ !== 'undefined') {
    // eslint-disable-next-line no-underscore-dangle, camelcase, no-undef
    return !!__webpack_modules__[key];
  }

  return false;
};

const resolveDefaultImport = (module) =>
  // eslint-disable-next-line no-underscore-dangle
  module.__esModule ? module.default : module.default || module;

export default function resolveComponent(component) {
  // Handle React lazy and driveline/lazy
  // eslint-disable-next-line no-underscore-dangle
  if (component.payload && component.payload._result) {
    // eslint-disable-next-line no-underscore-dangle
    const ctor = component.payload._result;

    // React lazy or driveline/lazy without Babel transformation.
    if (typeof ctor === 'function') {
      return new Resource(() => ctor());
    }

    // Await driveline/lazy component on server and on native.
    if (isServer || !isWeb) {
      return new Resource(() => component.load().then(() => component));
    }

    // Directly resolve promise with requireSync/requireAsync on client.
    return isLoaded(ctor)
      ? new SyncResource(resolveDefaultImport(ctor.requireSync()))
      : new Resource(() =>
          ctor.requireAsync().then((result) => resolveDefaultImport(result)),
        );
  }

  // Handle deprecated { name: ..., bundle: ... } syntax for lazy import
  if (component.bundle) {
    return new Resource(() =>
      component.bundle().then((result) => resolveDefaultImport(result)),
    );
  }

  // Not a lazy import.
  return new SyncResource(component);
}
