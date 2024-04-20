import SyncResource from '../resources/SyncResource';
import Resource from '../resources/Resource';

const applyRenderer = (Component, options) =>
  options.renderer ? options.renderer(Component) : Component;

const resolveES6 = (x) =>
  x !== null && (typeof x === 'function' || typeof x === 'object') && x.default
    ? x.default
    : x;

export default function resolveComponent(component, options) {
  if (!component.bundle) {
    return new SyncResource(applyRenderer(component, options));
  }

  return new Resource(() =>
    component
      .bundle()
      .then((result) => applyRenderer(resolveES6(result), options)),
  );
}
