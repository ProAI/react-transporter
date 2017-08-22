import formatEntity from './formatEntity';

export default class Selector {
  constructor(state, data) {
    this.state = state;
    this.data = data;
  }

  where() {
    // TODO

    return this;
  }

  orderBy() {
    // TODO

    return this;
  }

  limit() {
    // TODO

    return this;
  }

  join(name, constraints) {
    this.data.forEach((attributes, key) => {
      // eslint-disable-next-line no-underscore-dangle
      const type = this.data[key].__type;
      const id = this.data[key].id;
      const childrenIds = this.state.entities[type][id][name].connection;

      const entities = childrenIds.map(childrenId =>
        formatEntity(this.state.entities[childrenId[0]][childrenId[1]]),
      );

      this.data[key][name] = constraints(new Selector(entities));
    });

    return this;
  }

  getData() {
    return this.data;
  }
}
