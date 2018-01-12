export default function getTypeIds(typeIds) {
  if (typeof typeIds[0] === 'string' || typeIds[0] instanceof String) {
    if (typeof typeIds[1] === 'string' || typeIds[1] instanceof String) {
      // case 1) one type, one id
      return [typeIds];
    }

    // case 2) one type, many ids
    return typeIds[1].map(id => [typeIds[0], id]);
  }

  // case 3) many types, many ids
  return typeIds;
}
