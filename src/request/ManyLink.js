import getTypeIds from './utils/getTypeIds';
import prependEntities from './utils/prependEntities';
import appendEntities from './utils/appendEntities';
import detachEntities from './utils/detachEntities';
import isConnection from '../utils/isConnection';

export default class ManyLink {
  constructor(...args) {
    // object passed to constructor
    if (args.length === 1 && isConnection(args[0])) {
      this.meta = args[0].meta;
      this.link = args[0].link;
      return;
    }

    this.link = args ? getTypeIds(args) : [];
  }

  prepend(...args) {
    this.link = prependEntities(getTypeIds(args), this.link);
    return this;
  }

  append(...args) {
    this.link = appendEntities(getTypeIds(args), this.link);
    return this;
  }

  syncPrepend(...args) {
    this.link = prependEntities(getTypeIds(args), this.link, true);
    return this;
  }

  syncAppend(...args) {
    this.link = appendEntities(getTypeIds(args), this.link, true);
    return this;
  }

  detach(...args) {
    this.link = detachEntities(getTypeIds(args), this.link);
    return this;
  }

  setMeta(meta) {
    if (typeof meta === 'function') {
      this.meta = meta(this.meta);
    } else {
      this.meta = meta;
    }
    return this;
  }
}
