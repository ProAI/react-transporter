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

  toNative() {
    return this.ref;
  }
}
