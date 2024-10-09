import { createElement, useContext } from 'react';
import TransporterContext from '../TransporterContext';

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

    return createElement(component, getValues(store, props));
  }

  const name = component.displayName || component.name;
  ContainerNode.displayName = name ? `ContainerNode(${name})` : 'ContainerNode';

  return ContainerNode;
}
