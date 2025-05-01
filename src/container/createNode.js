import { createElement, useContext } from 'react';
import TransporterContext from '../TransporterContext';

class NodeStore {
  store;

  constructor(store) {
    this.store = store;
  }

  preload = () => {
    throw new Error(
      'preload() cannot be called on a node, only on a container.',
    );
  };

  load = () => {
    throw new Error('load() cannot be called on a node, only on a container.');
  };

  select = (...args) => this.store.select(...args);

  selectFragment = (...args) => this.store.selectFragment(...args);
}

export default function createNode(config) {
  const { component, ...options } = config;

  if (!config.component) {
    throw new Error(
      'React Transporter Node: You must define a node component.',
    );
  }

  const resolveData = options.data || (() => undefined);

  function ContainerNode(props) {
    const { client, store } = useContext(TransporterContext);

    const isWrappedInContainer = !!store.parentStore.parentStore;

    if (!isWrappedInContainer) {
      throw new Error(
        'React Transporter Node: A node must be wrapped in a container.',
      );
    }

    try {
      return createElement(component, resolveData(new NodeStore(store), props));
    } catch (rawError) {
      const error = client.transformContainerError
        ? client.transformContainerError(rawError)
        : rawError;

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
