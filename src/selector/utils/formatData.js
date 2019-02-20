import makeSelectorError from '../makeSelectorError';
import isConnection from '../../utils/isConnection';

export default function formatData(type, id, entities, shallow = false) {
  const attributes = {};

  // log warning if entity does not exist
  if (!entities.data[type] || !entities.data[type][id]) {
    throw makeSelectorError('MISSING_JOINED_ENTITY', { type, id });
  }

  // get full entity
  if (!shallow) {
    const entity = entities.data[type][id];

    if (entity) {
      Object.keys(entity).forEach(key => {
        if (!isConnection(entity[key])) {
          attributes[key] = entity[key];
        }
      });
    }

    // check if entity contains of optimistic data
    // eslint-disable-next-line no-underscore-dangle
    attributes.__optimistic = Boolean(
      entities.optimistic.updates[type] && entities.optimistic.updates[type][id],
    );
  }

  return {
    ...attributes,
    __shallow: shallow,
    __typename: type,
    id,
  };
}
