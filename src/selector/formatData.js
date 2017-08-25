export default function formatData(id, entity) {
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
