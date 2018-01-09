import getTypeIds from './utils/getTypeIds';
import prependEntities from './utils/prependEntities';
import appendEntities from './utils/appendEntities';
import detachEntities from './utils/detachEntities';

export default class ManyLink {
  constructor(...args) {
    // object passed to constructor
    if (args.length === 1 && args[0].link) {
      this.meta = args[0].meta;
      this.link = args[0].link;
    }

    this.meta = undefined;
    this.link = args ? getTypeIds(args) : [];
  }

  prepend(...args) {
    this.link = prependEntities(this.link, getTypeIds(args));
    return this;
  }

  append(...args) {
    this.link = appendEntities(this.link, getTypeIds(args));
    return this;
  }

  syncPrepend(...args) {
    this.link = prependEntities(this.link, getTypeIds(args), true);
    return this;
  }

  syncAppend(...args) {
    this.link = appendEntities(this.link, getTypeIds(args), true);
    return this;
  }

  detach(...args) {
    this.link = detachEntities(this.link, getTypeIds(args));
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
