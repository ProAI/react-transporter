import { REF_KEY } from '../constants';

const filterByValues = (items, values) => {
  const result = values.filter((value) => {
    if (!value[REF_KEY]) {
      return this.items.includes(value);
    }

    return !items.some(([type, id]) => type === value[0] && id === value[1]);
  });

  return result;
};

export default class ReferenceMap {
  items;

  constructor(items = []) {
    this.items = items;
  }

  prepend(...values) {
    this.items = [...values, ...this.items];

    return this;
  }

  append(...values) {
    this.items = [...this.items, ...values];

    return this;
  }

  syncPrepend(...values) {
    const filteredValues = filterByValues(this.items, values);

    this.items = [...values, ...filteredValues];

    return this;
  }

  syncAppend(...values) {
    const filteredValues = filterByValues(this.items, values);

    this.items = [...filteredValues, ...values];

    return this;
  }

  detach(...values) {
    this.items = filterByValues(this.items, values);

    return this;
  }

  toArray() {
    return this.items;
  }
}
