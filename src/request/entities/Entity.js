import enforceArray from '../../utils';

export default class Entity {
  constructor(id, attributes) {
    this.id = id;
    this.attributes = attributes;
  }

  addConnection(name, connectionIds, connectionAttributes = {}) {
    this.attributes[name] = {
      ...connectionAttributes,
      connection: enforceArray(connectionIds),
    };
  }

  addAttribute(name, value) {
    this.attributes[name] = value;
  }

  getId() {
    return this.id;
  }
}
