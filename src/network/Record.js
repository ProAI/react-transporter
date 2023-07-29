import ReferenceMap from './ReferenceMap';
import makeAttributeKeyWithArgs from './makeAttributeKeyWithArgs';

const isDate = (v) => Object.prototype.toString.call(v) === '[object Date]';

const castValue = (value) => {
  if (value instanceof ReferenceMap) {
    return value.toArray();
  }

  if (isDate(value)) {
    return value.toISOString();
  }

  return value;
};

export default class Record {
  original;

  values = {};

  constructor(original = {}) {
    this.original = original;
  }

  set(rawKey, resolve) {
    const key = Array.isArray(rawKey)
      ? makeAttributeKeyWithArgs(...rawKey)
      : rawKey;

    let nextValue;

    if (typeof resolve === 'function') {
      // Lazy load values.
      if (typeof this.original === 'function') {
        this.original = this.original() || {};
      }

      const value = Array.isArray(this.original[key])
        ? new ReferenceMap(this.original[key])
        : this.original[key];

      nextValue = resolve(value);
    } else {
      nextValue = resolve;
    }

    this.values[key] = castValue(nextValue);
  }

  fill(values) {
    Object.keys(values).forEach((key) => {
      this.set(key, values[key]);
    });
  }
}
