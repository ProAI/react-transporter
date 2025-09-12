import { TYPENAME, ID } from './constants';

export default class Link {
  ref;

  constructor(entity = null) {
    if (entity === null) {
      this.ref = null;
    } else {
      this.ref = [entity[TYPENAME], entity[ID]];
    }
  }

  static fromNative(ref) {
    const instance = new Link();
    instance.ref = ref;

    return instance;
  }

  equals(link) {
    return this.ref[0] === link.ref[0] && this.ref[1] === link.ref[1];
  }

  toNative() {
    return this.ref;
  }
}
