import { TYPENAME, ID } from './constants';

export default class Link {
  ref;

  constructor(value = null) {
    if (value === null) {
      this.ref = null;
    } else {
      this.ref = [value[TYPENAME], value[ID]];
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
