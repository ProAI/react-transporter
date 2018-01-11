import isSameEntity from '../../utils/isSameEntity';

export default function prependEntities(addEntities, entities, sync = false) {
  // prepend, don't sync
  if (!sync) {
    return addEntities.concat(entities);
  }

  // prepend and sync
  // eslint-disable-next-line max-len
  const prependedEntities = addEntities.filter(addEntity => !entities.some(entity => isSameEntity(addEntity, entity)));
  const filteredEntities = entities.filter(entity =>
    addEntities.some(addEntity => isSameEntity(entity, addEntity)));
  return prependedEntities.concat(filteredEntities);
}
