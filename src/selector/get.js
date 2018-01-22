import createSelector from './createSelector';

export default function getData(type, idOrIds, query) {
  return createSelector((store) => {
    const entities = store.select(type, idOrIds);
    return query ? query(entities) : entities;
  });
}
