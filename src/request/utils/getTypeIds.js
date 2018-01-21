export default function getTypeIds(type, idOrIds) {
  if (typeof type === 'string' || type instanceof String) {
    if (typeof idOrIds === 'string' || idOrIds instanceof String) {
      // case 1) one type, one id
      return [type, idOrIds];
    }

    // case 2) one type, many ids
    return idOrIds.map(id => [type, id]);
  }

  // case 3) many types, many ids
  return type;
}
