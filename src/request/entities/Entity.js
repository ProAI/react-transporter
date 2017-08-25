export default class Entity {
  constructor(id, attributes) {
    this.id = id;
    this.attributes = attributes;
  }

  addConnection(name, idOrIds, attributes = {}) {
    this.attributes[name] = {
      ...attributes,
      connection: idOrIds,
    };
  }

  addAttribute(name, value) {
    this.attributes[name] = value;
  }

  getId() {
    return this.id;
  }
}
