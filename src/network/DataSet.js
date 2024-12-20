import { TYPENAME, ID } from '../constants';

const intersect = (left = {}, right = {}, condition = () => true) => {
  if (right === null) {
    throw new Error(
      'Key not found. This can happen if there is a deleted entity that is still in use.',
    );
  }

  return Object.keys(right).some(
    (key) => left[key] !== undefined && condition(key),
  );
};

const merge = (left = {}, right = {}, condition = (v) => v) => {
  if (!condition) return { ...left, ...right };

  const result = { ...left };

  Object.entries(right).forEach(([key, value]) => {
    result[key] = left[key] === undefined ? value : condition(key);
  });

  return result;
};

const mergeValue = (key, left, right) => {
  // Value is not defined on right side, so keep left side.
  if (right === undefined) {
    return left;
  }

  if (left !== undefined && typeof left !== typeof right) {
    // eslint-disable-next-line no-console
    console.warn(
      `Key ${key} had value "${left}" and was updated with value of different type "${right}".`,
    );
  }

  return right;
};

/* eslint-disable arrow-body-style */
export default class DataSet {
  roots;

  entities;

  constructor(data = {}) {
    const { roots = {}, entities = {} } = data;

    this.roots = roots;
    this.entities = entities;
  }

  get = (type, id) => {
    const data = this.entities[type]?.[id];

    if (!data) {
      return null;
    }

    return {
      [TYPENAME]: type,
      [ID]: id,
      ...data,
    };
  };

  getRoots = () => {
    return this.roots;
  };

  intersectWith = (data) => {
    const { roots, entities } = data;

    return (
      intersect(this.roots, roots) ||
      intersect(this.entities, entities, (type) =>
        intersect(this.entities[type], entities[type], (id) =>
          intersect(this.entities[type][id], entities[type][id]),
        ),
      )
    );
  };

  add = (data) => {
    const { roots, entities } = data;

    this.roots = merge(this.roots, roots);
    this.entities = merge(this.entities, entities, (type) =>
      merge(this.entities[type], entities[type], (id) => {
        const left = this.entities[type][id];
        const right = entities[type][id];

        // Deleted entity
        if (right === null) {
          return null;
        }

        const result = { ...left };

        Object.keys(right).forEach((key) => {
          result[key] = mergeValue(key, left[key], right[key]);
        });

        return result;
      }),
    );
  };

  merge = (data) => {
    const result = new DataSet({ roots: this.roots, entities: this.entities });

    result.add(data);

    return result;
  };

  extract = () => {
    return { roots: this.roots, entities: this.entities };
  };
}
