import isSameEntity from '../../utils/isSameEntity';

export default function appendEntities(addEntities, entities, sync = false) {
  // append, don't sync
  if (!sync) {
    return entities.concat(addEntities);
  }

  // append and sync
  // eslint-disable-next-line max-len
  const appendedEntities = addEntities.filter(addEntity => !entities.some(entity => isSameEntity(addEntity, entity)));
  const filteredEntities = entities.filter(entity =>
    addEntities.some(addEntity => isSameEntity(entity, addEntity)));
  return filteredEntities.concat(appendedEntities);
}
