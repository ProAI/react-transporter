import sameEntity from './sameEntity';

export default function appendEntities(addEntities, entities, sync = false) {
  // append, don't sync
  if (!sync) {
    return entities.concat(addEntities);
  }

  // append and sync
  // eslint-disable-next-line max-len
  const appendedEntities = addEntities.filter(addEntity => !entities.some(entity => sameEntity(addEntity, entity)));
  const filteredEntities = entities.filter(entity =>
    addEntities.some(addEntity => sameEntity(entity, addEntity)));
  return filteredEntities.concat(appendedEntities);
}
