import { TYPENAME, ID } from './constants';

const convertToRefs = (value) => {
  const values = Array.isArray(value) ? value : [value];

  return values.map((v) => [v[TYPENAME], v[ID]]);
};

const removeDuplicateRefs = (currentRefs, refs) => {
  const result = refs.filter((ref) => {
    const [refType, refId] = ref;

    return !currentRefs.some(([type, id]) => type === refType && id === refId);
  });

  return result;
};

export default class ManyLink {
  refs;

  constructor(value = []) {
    this.refs = convertToRefs(value);
  }

  static fromNative(refs) {
    const instance = new ManyLink();
    instance.refs = refs;

    return instance;
  }

  prepend(value) {
    this.refs = [...convertToRefs(value), ...this.refs];

    return this;
  }

  append(value) {
    this.refs = [...this.refs, ...convertToRefs(value)];

    return this;
  }

  syncPrepend(value) {
    const refs = convertToRefs(value);
    const filteredRefs = removeDuplicateRefs(this.refs, refs);

    this.refs = [...refs, ...filteredRefs];

    return this;
  }

  syncAppend(value) {
    const refs = convertToRefs(value);
    const filteredRefs = removeDuplicateRefs(this.refs, refs);

    this.refs = [...filteredRefs, ...refs];

    return this;
  }

  detach(value) {
    const refs = convertToRefs(value);
    this.refs = removeDuplicateRefs(refs, this.refs);

    return this;
  }

  toNative() {
    return this.refs;
  }
}
