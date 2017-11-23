import sameEntity from './sameEntity';

export default function prependEntities(addEntities, entities, sync = false) {
  // prepend, don't sync
  if (!sync) {
    return addEntities.concat(entities);
  }

  // prepend and sync
  // eslint-disable-next-line max-len
  const prependedEntities = addEntities.filter(addEntity => !entities.some(entity => sameEntity(addEntity, entity)));
  const filteredEntities = entities.filter(entity =>
    addEntities.some(addEntity => sameEntity(entity, addEntity)));
  return prependedEntities.concat(filteredEntities);
}
