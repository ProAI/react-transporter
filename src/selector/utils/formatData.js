import { logSelectLinkedEntityWarning } from './handleErrors';

export default function formatData(type, id, entities) {
  const attributes = {};

  if (entities) {
    if (!entities[type] || (entities[type] && !entities[type][id])) {
      logSelectLinkedEntityWarning(type, id);
      return undefined;
    }

    const entity = entities[type][id];

    if (entity) {
      Object.keys(entity).forEach((key) => {
        if (entity[key] !== null && entity[key] !== undefined && !entity[key].linked) {
          attributes[key] = entity[key];
        }
      });
    }
  }

  if (!entities) {
    // eslint-disable-next-line no-underscore-dangle
    attributes.__shadow = true;
  }

  return {
    ...attributes,
    __typename: type,
    id,
  };
}
