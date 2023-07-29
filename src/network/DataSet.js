import { TYPENAME, ID, REF_KEY } from '../constants';

const intersect = (left, right, condition = () => {}) =>
  Object.keys(right).some((key) => left[key] !== undefined && condition(key));

const merge = (left, right, condition = (v) => v) => {
  if (!condition) return { ...left, ...right };

  const result = { ...left };

  Object.values(right).forEach(([key, value]) => {
    result[key] = left[key] === undefined ? value : condition(key);
  });

  return result;
};

const mergeValue = (left, right) => {
  if (!right) {
    return left;
  }

  if (Array.isArray(left)) {
    return left.map((v, k) => mergeValue(v, right[k]));
  }

  if (typeof value !== 'object' || left[REF_KEY]) {
    return right;
  }

  const result = {};

  Object.keys(left).forEach((key) => {
    result[key] = mergeValue(left[key], right[key]);
  });

  return result;
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
      intersect(this.roots, roots),
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

        const result = { ...left };

        Object.keys(right).forEach((key) => {
          result[key] = mergeValue(left[key], right[key]);
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
