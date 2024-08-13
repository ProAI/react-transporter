import { createElement, useContext } from 'react';
import TransporterContext from '../TransporterContext';

export default function createNode(config) {
  const { component, ...options } = config;

  if (!config.component) {
    throw new Error(`You must define a container "component".`);
  }

  function ContainerNode(props) {
    const { store } = useContext(TransporterContext);

    const getValues = options.data || (() => null);

    return createElement(component, getValues(store, props));
  }

  const name = component.displayName || component.name;
  ContainerNode.displayName = name ? `ContainerNode(${name})` : 'ContainerNode';

  return ContainerNode;
}
