export default class EntityMap {
  constructor(obj) {
    this.obj = obj || {};
  }

  forEach(callback) {
    Object.keys(this.obj).forEach(type => {
      Object.keys(this.obj[type]).forEach(id => {
        callback([this.obj[type][id], type, id]);
      });
    });
  }

  get(type, id) {
    if (!this.obj[type] || !this.obj[type][id]) return undefined;

    return this.obj[type][id];
  }

  set(type, id, data) {
    if (!this.obj[type]) this.obj[type] = {};

    this.obj[type][id] = data;
  }

  delete(type, id) {
    if (!this.obj[type] || !this.obj[type][id]) {
      throw new Error(`Cannot delete entity [${type}, ${id}], because entity does not exist.`);
    }

    delete this.obj[type][id];

    if (Object.keys(this.obj[type]).length === 0) delete this.obj[type];
  }

  toSource() {
    return this.obj;
  }
}
