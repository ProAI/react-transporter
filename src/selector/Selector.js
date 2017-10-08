import { hasMany, compareValues } from '../utils';
import formatData from './formatData';
import getChildrenData from './getChildrenData';

export default class Selector {
  constructor(state, data) {
    this.hasMany = hasMany(data);

    this.data = this.hasMany
      ? data.map(id => formatData(id, state.entities))
      : formatData(data, state.entities);

    this.state = state;
  }

  where(attribute, inputOperator, inputValue) {
    const value = inputValue || inputOperator;
    const operator = inputValue ? inputOperator : '=';

    if (!hasMany) {
      if (!compareValues(this.data[attribute], operator, value)) {
        this.data = null;
      }
    }
    if (hasMany) {
      this.data = this.data.filter(data => compareValues(data[attribute], operator, value));
    }

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

  shallowJoin(name) {
    if (this.hasMany) {
      this.data.forEach((attributes, key) => {
        // eslint-disable-next-line no-underscore-dangle
        const id = [this.data[key].__typename, this.data[key].id];
        this.data[key][name] = getChildrenData(this.state, id, name, null, true);
      });
    } else {
      // eslint-disable-next-line no-underscore-dangle
      const id = [this.data.__typename, this.data.id];
      this.data[name] = getChildrenData(this.state, id, name, null, true);
    }

    return this;
  }

  join(name, constraints) {
    if (this.hasMany) {
      this.data.forEach((attributes, key) => {
        // eslint-disable-next-line no-underscore-dangle
        const id = [this.data[key].__typename, this.data[key].id];
        this.data[key][name] = getChildrenData(this.state, id, name, constraints);
      });
    } else {
      // eslint-disable-next-line no-underscore-dangle
      const id = [this.data.__typename, this.data.id];
      this.data[name] = getChildrenData(this.state, id, name, constraints);
    }

    return this;
  }

  getData() {
    return this.data;
  }
}
