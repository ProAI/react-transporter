import Link from '../Link';
import ManyLink from '../ManyLink';
import { REF_KEY } from '../constants';

const isDate = (v) => Object.prototype.toString.call(v) === '[object Date]';

export default class ValueCaster {
  static fromNative(value) {
    if (Array.isArray(value)) {
      return value.map((v) => ValueCaster.fromNative(v));
    }

    if (typeof value === 'object') {
      if (REF_KEY in value) {
        const ref = value[REF_KEY];

        if (ref.length === 2 && !Array.isArray(ref[0])) {
          return Link.fromNative(ref);
        }

        return ManyLink.fromNative(ref);
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
      return {
        [REF_KEY]: value.toNative(),
      };
    }

    if (isDate(value)) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((v) => ValueCaster.toNative(v));
    }

    if (value && typeof value === 'object') {
      const result = {};

      Object.entries(value).forEach(([k, v]) => {
        result[k] = ValueCaster.toNative(v);
      });

      return result;
    }

    return value;
  }
}
