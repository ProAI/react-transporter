import sameEntity from './sameEntity';

export default function detachEntities(removeEntities, entities) {
  // detach all entities
  if (removeEntities === null) {
    return [];
  }

  // eslint-disable-next-line max-len
  return entities.filter(entity => !removeEntities.some(removeEntity => sameEntity(entity, removeEntity)));
}
