import sameEntity from './sameEntity';

export default function detachEntities(removeEntities, entities) {
  // eslint-disable-next-line max-len
  return entities.filter(entity => !removeEntities.some(removeEntity => sameEntity(entity, removeEntity)));
}
