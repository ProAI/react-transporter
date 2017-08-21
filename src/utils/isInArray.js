import isEqual from './isEqual';

export default function isInArray(id, collectionIds) {
  let found = false;
  collectionIds.forEach((collectionId, key) => {
    if (isEqual(collectionId, id)) {
      found = key;
    }
  });

  return found;
}
