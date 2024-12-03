import { REF_KEY, TYPENAME, ID } from './constants';

const convertToRefs = (input) => {
  const values = Array.isArray(input) ? input : [input];

  return values.map((value) => ({
    [REF_KEY]: [value[TYPENAME], value[ID]],
  }));
};

const removeDuplicateRefs = (currentRefs, refs) => {
  const result = refs.filter((ref) => {
    const [refType, refId] = ref[REF_KEY];

    return !currentRefs.some(
      ({ [REF_KEY]: [type, id] }) => type === refType && id === refId,
    );
  });

  return result;
};

export default class ManyLink {
  refs;

  constructor(input = []) {
    this.refs = convertToRefs(input);
  }

  static fromNative(refs) {
    const instance = new ManyLink();
    instance.refs = refs;

    return instance;
  }

  prepend(input) {
    this.refs = [...convertToRefs(input), ...this.refs];

    return this;
  }

  append(input) {
    this.refs = [...this.refs, ...convertToRefs(input)];

    return this;
  }

  syncPrepend(input) {
    const refs = convertToRefs(input);
    const filteredRefs = removeDuplicateRefs(this.refs, refs);

    this.refs = [...refs, ...filteredRefs];

    return this;
  }

  syncAppend(input) {
    const refs = convertToRefs(input);
    const filteredRefs = removeDuplicateRefs(this.refs, refs);

    this.refs = [...filteredRefs, ...refs];

    return this;
  }

  detach(input) {
    const refs = convertToRefs(input);
    this.refs = removeDuplicateRefs(refs, this.refs);

    return this;
  }

  toNative() {
    return this.refs;
  }
}
