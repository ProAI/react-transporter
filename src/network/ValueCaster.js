import Link from '../Link';
import ManyLink from '../ManyLink';
import { REF_KEY } from '../constants';

const isDate = (v) => Object.prototype.toString.call(v) === '[object Date]';

export default class ValueCaster {
  static fromNative(value) {
    if (Array.isArray(value)) {
      if (value.some((v) => typeof v === 'object' && REF_KEY in v)) {
        return ManyLink.fromNative(value);
      }

      return value.map((v) => ValueCaster.fromNative(v));
    }

    if (typeof value === 'object') {
      if (REF_KEY in value) {
        return Link.fromNative(value);
      }

      const result = {};

      Object.entries(value).forEach(([k, v]) => {
        result[k] = ValueCaster.fromNative(v);
      });

      return result;
    }

    return value;
  }

  static toNative(value) {
    if (value instanceof Link || value instanceof ManyLink) {
      return value.toNative();
    }

    if (isDate(value)) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((v) => ValueCaster.toNative(v));
    }

    if (typeof value === 'object') {
      const result = {};

      Object.entries(value).forEach(([k, v]) => {
        result[k] = ValueCaster.toNative(v);
      });

      return result;
    }

    return value;
  }
}
