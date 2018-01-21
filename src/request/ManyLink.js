import getTypeIds from './utils/getTypeIds';
import prependEntities from './utils/prependEntities';
import appendEntities from './utils/appendEntities';
import detachEntities from './utils/detachEntities';
import isConnection from '../utils/isConnection';

export default class ManyLink {
  constructor(type, idOrIds) {
    // object passed to constructor
    if (idOrIds === undefined && isConnection(type)) {
      this.meta = type.meta;
      this.link = type.link;
      return;
    }

    this.link = type ? getTypeIds(type) : [];
  }

  prepend(type, idOrIds) {
    this.link = prependEntities(getTypeIds(type, idOrIds), this.link);
    return this;
  }

  append(type, idOrIds) {
    this.link = appendEntities(getTypeIds(type, idOrIds), this.link);
    return this;
  }

  syncPrepend(type, idOrIds) {
    this.link = prependEntities(getTypeIds(type, idOrIds), this.link, true);
    return this;
  }

  syncAppend(type, idOrIds) {
    this.link = appendEntities(getTypeIds(type, idOrIds), this.link, true);
    return this;
  }

  detach(type, idOrIds) {
    this.link = detachEntities(getTypeIds(type, idOrIds), this.link);
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
