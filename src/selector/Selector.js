import { hasMany } from '../utils';
import formatData from './formatData';
import getConnectionData from './getConnectionData';

export default class Selector {
  constructor(state, data) {
    this.hasMany = hasMany(data);

    this.data = this.hasMany
      ? data.map(id => formatData(id, state.entities))
      : formatData(data, state.entities);

    this.state = state;
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
    if (this.hasMany) {
      this.data.forEach((attributes, key) => {
        // eslint-disable-next-line no-underscore-dangle
        const id = [this.data[key].__typename, this.data[key].id];
        this.data[key][name] = getConnectionData(this.state, id, name, constraints);
      });
    } else {
      // eslint-disable-next-line no-underscore-dangle
      const id = [this.data.__typename, this.data.id];
      this.data[name] = getConnectionData(this.state, id, name, constraints);
    }

    return this;
  }

  getData() {
    return this.data;
  }
}
