import isConnection from '../utils/isConnection';

export default class Link {
  constructor(type, id) {
    // object passed to constructor
    if (id === undefined && type !== undefined && isConnection(type)) {
      this.meta = type.meta;
      this.link = type.link;
      return;
    }

    // value is null
    if (id === undefined && type === undefined) {
      this.link = null;
      return;
    }

    this.link = [type, id];
  }

  setMeta(meta) {
    if (typeof meta === 'function') {
      this.meta = meta(this.meta);
    } else {
      this.meta = meta;
    }
    return this;
  }

  toObject() {
    return {
      link: this.link,
      meta: this.meta,
    };
  }
}
