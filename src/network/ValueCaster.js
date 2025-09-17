import Link from '../Link';
import Collection from '../Collection';
import { REF_KEY, TYPENAME, ID } from '../constants';

// Native format:
// - Only uses arrays and { ref: [typename, id] } refs
//
// User (non-native) format:
// - Uses Collection instances instead of arrays
// - Uses Link instances instead of { ref: [typename, id] } refs
// - Also allows { __typename, id, ... } objects as refs

const isDate = (v) => Object.prototype.toString.call(v) === '[object Date]';

export default class ValueCaster {
  static fromNative(value) {
    if (Array.isArray(value)) {
      return Collection.fromNative(value.map((v) => ValueCaster.fromNative(v)));
    }

    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (REF_KEY in value) {
      return Link.fromNative(value[REF_KEY]);
    }

    const item = {};

    Object.entries(value).forEach(([k, v]) => {
      item[k] = ValueCaster.fromNative(v);
    });

    return item;
  }

  static toNative(value) {
    if (isDate(value)) {
      return value.toISOString();
    }

    if (value instanceof Collection) {
      return value.toNative().map((v) => ValueCaster.toNative(v));
    }

    if (Array.isArray(value)) {
      return value.map((v) => ValueCaster.toNative(v));
    }

    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (value instanceof Link) {
      return { [REF_KEY]: value.toNative() };
    }

    if (ID in value && TYPENAME in value) {
      return { [REF_KEY]: new Link(value).toNative() };
    }

    const item = {};

    Object.entries(value).forEach(([k, v]) => {
      item[k] = ValueCaster.toNative(v);
    });

    return item;
  }
}
