import Record from './Record';
import { TYPENAME, ID } from '../constants';

const get = (client, type, id) => {
  let value = null;

  client.queries.forEach((query) => {
    const data = query.cache.data.get(type, id);

    if (data) {
      if (
        query.cache.updates.some((u) => u.optimistic && u.data.get(type, id))
      ) {
        throw new Error(
          `Cannot perform update on optimistically updated record. [${type}.${id}]`,
        );
      }

      value = { ...value, ...data };
    }
  });

  return value;
};

const getRoots = (client) => {
  let value = null;

  client.queries.forEach((query) => {
    const roots = query.cache.data.getRoots();

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
    insert(type, id, values) {
      const record = new Record();

      if (typeof values === 'function') {
        values(record);
      } else {
        record.fill(values);
      }

      result.add({
        entities: { [type]: { [id]: record.values } },
      });
    },
    update(entity, values) {
      const { [TYPENAME]: type, [ID]: id } = entity;

      const record = new Record(() => ({
        ...get(client, type, id),
        ...result.get(type, id),
      }));

      if (typeof values === 'function') {
        values(record);
      } else {
        record.fill(values);
      }

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
    delete(entity) {
      const { [TYPENAME]: type, [ID]: id } = entity;

      result.add({
        entities: { [type]: { [id]: null } },
      });
    },
  };

  updater(writeStore, cache?.graphData.getQuery());

  return result;
}
