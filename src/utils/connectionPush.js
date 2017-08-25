import isInArray from './isInArray';

export default function connectionPush(ids, newIds) {
  const returnIds = [...ids];

  newIds.forEach((newId) => {
    if (isInArray(newId, ids) === false) {
      returnIds.push(newId);
    }
  });

  return returnIds;
}
