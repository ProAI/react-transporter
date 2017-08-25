import isInArray from './isInArray';

export default function connectionSlice(ids, newIds) {
  const returnIds = [...ids];

  newIds.forEach((newId) => {
    const key = isInArray(newId, ids);
    if (key !== false) {
      returnIds.splice(key, 1);
    }
  });

  return returnIds;
}
