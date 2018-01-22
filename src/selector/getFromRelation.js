import createSelector from './createSelector';

export default function getFromRelation(type, idOrIds, name, query) {
  return createSelector((store) => {
    const entities = store.select(type, idOrIds, name);
    return query ? query(entities) : entities;
  });
}
