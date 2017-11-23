export default function mergeEntities(entity1, entity2) {
  const mergedEntity = { ...entity1 };

  Object.keys(entity2).forEach((key) => {
    if (entity1[key] && entity1[key].linked) {
      // merge existing connection
      mergedEntity[key] = {
        ...entity1[key],
        ...entity2[key],
        linked: entity1[key].linked.concat(entity2[key].linked),
      };
    } else {
      // add attribute
      mergedEntity[key] = entity2[key];
    }
  });

  return mergedEntity;
}
