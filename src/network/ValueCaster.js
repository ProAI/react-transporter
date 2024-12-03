import Link from '../Link';
import ManyLink from '../ManyLink';
import { REF_KEY } from '../constants';

const isDate = (v) => Object.prototype.toString.call(v) === '[object Date]';

export default class ValueCaster {
  static fromStore(value) {
    if (Array.isArray(value)) {
      if (value.some((v) => typeof v === 'object' && REF_KEY in v)) {
        return ManyLink.fromNative(value);
      }

      return value.map((v) => ValueCaster.fromStore(v));
    }

    if (typeof value === 'object') {
      if (REF_KEY in value) {
        return Link.fromNative(value);
      }

      const result = {};

      Object.entries(value).forEach(([k, v]) => {
        result[k] = ValueCaster.fromStore(v);
      });

      return result;
    }

    return value;
  }

  static toStore(value) {
    if (value instanceof Link || value instanceof ManyLink) {
      return value.toNative();
    }

    if (isDate(value)) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((v) => ValueCaster.toStore(v));
    }

    if (typeof value === 'object') {
      const result = {};

      Object.entries(value).forEach(([k, v]) => {
        result[k] = ValueCaster.toStore(v);
      });

      return result;
    }

    return value;
  }
}
