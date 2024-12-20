import Record from './Record';

const get = (client, type, id) => {
  let value = null;

  client.queries.forEach((query) => {
    const entity = query.data.get(type, id);

    if (entity) {
      if (query.updates.some((u) => u.optimistic && u.data.get(type, id))) {
        throw new Error(
          `Cannot perform update on optimistically updated entity. [${type}.${id}]`,
        );
      }

      value = { ...value, ...entity };
    }
  });

  return value;
};

const getRoots = (client) => {
  let value = null;

  client.queries.forEach((query) => {
    const roots = query.data.getRoots();

    value = { ...value, ...roots };
  });

  return value;
};

export default function applyUpdater(client, updater, data, cache) {
  if (!updater) {
    return data;
  }

  const result = data;

  const writeStore = {
    insert(type, id, resolve) {
      const record = new Record();

      resolve(record);

      result.add({
        entities: { [type]: { [id]: record.values } },
      });
    },
    update(type, id, resolve) {
      const record = new Record(() => ({
        ...get(client, type, id),
        ...result.get(type, id),
      }));

      resolve(record);

      result.add({
        entities: { [type]: { [id]: record.values } },
      });
    },
    updateRoots(resolve) {
      const record = new Record(() => getRoots(client));

      resolve(record);

      result.add({
        roots: record.values,
      });
    },
    delete(type, id) {
      result.add({
        entities: { [type]: { [id]: null } },
      });
    },
  };

  updater(writeStore, cache.graphData.getQuery());

  return result;
}
