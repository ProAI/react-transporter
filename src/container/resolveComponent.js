import SyncResource from '../resources/SyncResource';
import Resource from '../resources/Resource';

const resolveES6 = (x) =>
  x !== null && (typeof x === 'function' || typeof x === 'object') && x.default
    ? x.default
    : x;

export default function resolveComponent(component) {
  if (!component.bundle) {
    return new SyncResource(component);
  }

  return new Resource(() =>
    component.bundle().then((result) => resolveES6(result)),
  );
}
