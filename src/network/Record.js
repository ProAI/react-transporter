import makeAttributeKeyWithArgs from './makeAttributeKeyWithArgs';
import ValueCaster from './ValueCaster';

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

      const value = ValueCaster.fromStore(this.original[key]);

      nextValue = resolve(value);
    } else {
      nextValue = resolve;
    }

    this.values[key] = ValueCaster.toStore(nextValue);
  }

  fill(values) {
    Object.keys(values).forEach((key) => {
      this.set(key, values[key]);
    });
  }
}
