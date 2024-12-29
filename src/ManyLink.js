import { TYPENAME, ID } from './constants';

const convertToRefs = (entityOrEntities) => {
  const entities = Array.isArray(entityOrEntities)
    ? entityOrEntities
    : [entityOrEntities];

  return entities.map((v) => [v[TYPENAME], v[ID]]);
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

  constructor(entityOrEntities = []) {
    this.refs = convertToRefs(entityOrEntities);
  }

  static fromNative(refs) {
    const instance = new ManyLink();
    instance.refs = refs;

    return instance;
  }

  prepend(entityOrEntities) {
    this.refs = [...convertToRefs(entityOrEntities), ...this.refs];

    return this;
  }

  append(entityOrEntities) {
    this.refs = [...this.refs, ...convertToRefs(entityOrEntities)];

    return this;
  }

  syncPrepend(entityOrEntities) {
    const refs = convertToRefs(entityOrEntities);
    const filteredRefs = removeDuplicateRefs(this.refs, refs);

    this.refs = [...refs, ...filteredRefs];

    return this;
  }

  syncAppend(entityOrEntities) {
    const refs = convertToRefs(entityOrEntities);
    const filteredRefs = removeDuplicateRefs(this.refs, refs);

    this.refs = [...filteredRefs, ...refs];

    return this;
  }

  detach(entityOrEntities) {
    const refs = convertToRefs(entityOrEntities);
    this.refs = removeDuplicateRefs(refs, this.refs);

    return this;
  }

  toNative() {
    return this.refs;
  }
}
