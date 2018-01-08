/* eslint-disable no-underscore-dangle */
export default class Link {
  constructor(type, id) {
    // object passed to constructor
    if (id === undefined && type.link) {
      this.meta = type.meta;
      this.link = type.link;
    }

    this.meta = undefined;
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
}
