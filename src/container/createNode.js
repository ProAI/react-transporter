import { createElement, useContext } from 'react';
import TransporterContext from '../TransporterContext';

class ReadOnlyStore {
  store;

  constructor(store) {
    this.store = store;
  }

  select = (name) => this.store.select(name);

  selectFragment = (name, entity) => this.store.selectFragment(name, entity);
}

export default function createNode(config) {
  const { component, ...options } = config;

  if (!config.component) {
    throw new Error(
      'React Transporter Node: You must define a node component.',
    );
  }

  function ContainerNode(props) {
    const { store } = useContext(TransporterContext);

    const isWrappedInContainer = !!store.parentStore.parentStore;

    if (!isWrappedInContainer) {
      throw new Error(
        'React Transporter Node: A node must be wrapped in a container.',
      );
    }

    const getValues = options.data || (() => null);

    try {
      return createElement(
        component,
        getValues(new ReadOnlyStore(store), props),
      );
    } catch (error) {
      if (error instanceof Promise) {
        throw new Error(
          'React Transporter Node: Query requested before loaded. Wrap node into another container.',
        );
      }

      throw error;
    }
  }

  const name = component.displayName || component.name;
  ContainerNode.displayName = name ? `ContainerNode(${name})` : 'ContainerNode';

  return ContainerNode;
}
