import resolveComponent from './resolveComponent';

export default function createComponentResolver(component, renderer) {
  let resource;
  let ResolvedComponent;

  return {
    resolve() {
      if (!ResolvedComponent) {
        if (!resource) {
          resource = resolveComponent(component);
        }

        const Component = resource.read();

        ResolvedComponent = renderer ? renderer(Component) : Component;
      }

      return ResolvedComponent;
    },
    resetOnError() {
      try {
        resource.read();
      } catch (err) {
        if (err instanceof Promise) {
          return;
        }

        resource = resolveComponent(component);
      }
    },
  };
}
