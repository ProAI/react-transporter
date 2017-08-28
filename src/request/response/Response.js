export default class Response {
  constructor(entities = null, root = null, trash = null) {
    this.data = {
      entities,
      root,
      trash,
    };
  }

  addEntity(id, attributes) {
    // create entities object if none exists
    if (!this.data.entities) {
      this.data.entities = {};
    }

    // create type property if none exists
    if (!this.data.entities[id[0]]) {
      this.data.entities[id[0]] = {};
    }

    // add entity and attributes
    if (typeof attributes === 'object' || attributes === Object) {
      this.data.entities[id[0]][id[1]] = attributes;
    } else {
      this.data.entities[id[0]][id[1]] = attributes((idOrIds, connectionAttributes = {}) => ({
        ...connectionAttributes,
        connection: idOrIds,
      }));
    }

    return this;
  }

  root(idOrIds) {
    this.data.root = idOrIds;

    return this;
  }

  trash(idOrIds) {
    this.data.trash = idOrIds;

    return this;
  }

  getEntities() {
    return this.data.entities;
  }

  getRoot() {
    return this.data.root;
  }

  getTrash() {
    return this.data.trash;
  }
}
