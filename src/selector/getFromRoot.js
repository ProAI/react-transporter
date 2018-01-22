import createSelector from './createSelector';

export default function getFromRoot(name, query) {
  return createSelector((store) => {
    const entities = store.select(name);
    return query ? query(entities) : entities;
  });
}
