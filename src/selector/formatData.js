export default function formatData(id, entities) {
  const entity = entities[id[0]][id[1]];

  if (!entity) {
    return null;
  }

  const attributes = {};

  Object.keys(entity).forEach((key) => {
    if (!entity[key].connection) {
      attributes[key] = entity[key];
    }
  });

  return {
    ...attributes,
    __type: id[0],
    id: id[1],
  };
}
