import Record from './Record';

const get = (store, type, id) => {
  let value = null;

  store.queries.forEach((query) => {
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

const getRoots = (store) => {
  let value = null;

  store.queries.forEach((query) => {
    const roots = query.data.getRoots();

    value = { ...value, ...roots };
  });

  return value;
};

export default function applyUpdater(store, updater, data) {
  if (!updater) {
    return data;
  }

  let result = data;

  const writeStore = {
    insert(type, id, resolve) {
      const record = new Record();

      resolve(record);

      result = result.merge({
        entities: { [type]: { [id]: record.values } },
      });
    },
    update(type, id, resolve) {
      const record = new Record(() => ({
        ...get(store, type, id),
        ...result.get(type, id),
      }));

      resolve(record);

      result = result.merge({
        entities: { [type]: { [id]: record.values } },
      });
    },
    updateRoots(resolve) {
      const record = new Record(() => getRoots(store));

      resolve(record);

      result = result.merge({
        roots: record.values,
      });
    },
  };

  updater(writeStore);

  return result;
}
