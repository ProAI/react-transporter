import isConnection from '../utils/isConnection';

export default class Link {
  constructor(type, id) {
    if (!type) {
      this.link = null;
    } else if (isConnection(type)) {
      this.meta = type.meta;
      this.link = type.link;
    } else {
      this.link = [type, id];
    }
  }

  setMeta(meta) {
    if (typeof meta === 'function') {
      this.meta = meta(this.meta);
    } else {
      this.meta = meta;
    }
    return this;
  }

  toSource() {
    return {
      link: this.link,
      meta: this.meta,
    };
  }
}
