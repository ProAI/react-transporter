import SelectorError from '../SelectorError';

export default function formatData(type, id, entities, shallow = false) {
  const attributes = {};

  // log warning if entity does not exist
  if (!entities[type] || !entities[type][id]) {
    throw new SelectorError('MISSING_JOINED_ENTITY', { type, id });
  }

  // get full entity
  if (!shallow) {
    const entity = entities[type][id];

    if (entity) {
      Object.keys(entity).forEach((key) => {
        if (entity[key] !== null && entity[key] !== undefined && !entity[key].linked) {
          attributes[key] = entity[key];
        }
      });
    }
  }

  // only get shallow entity, i.e. __typename and id
  if (shallow) {
    // eslint-disable-next-line no-underscore-dangle
    attributes.__shadow = true;
  }

  return {
    ...attributes,
    __typename: type,
    id,
  };
}
