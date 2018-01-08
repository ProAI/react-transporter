import isSameEntity from './isSameEntity';

export default function detachEntities(removeEntities, entities) {
  // detach all entities
  if (removeEntities === null) {
    return [];
  }

  // eslint-disable-next-line max-len
  return entities.filter(entity => !removeEntities.some(removeEntity => isSameEntity(entity, removeEntity)));
}
