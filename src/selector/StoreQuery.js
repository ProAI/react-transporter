import isManyLink from '../utils/isManyLink';
import compareValues from './utils/compareValues';
import formatData from './utils/formatData';
import getRelationData from './utils/getRelationData';
import getName from '../utils/getName';

export default class StoreQuery {
  constructor(state, typeIdOrIds) {
    this.isManyLink = isManyLink(typeIdOrIds);

    this.data = this.isManyLink
      ? typeIdOrIds
        .map(typeId => formatData(typeId[0], typeId[1], state.entities.data))
        .filter(item => item !== undefined)
      : formatData(typeIdOrIds[0], typeIdOrIds[1], state.entities.data);

    this.state = state;
  }

  where(attribute, inputOperator, inputValue) {
    const value = inputValue || inputOperator;
    const operator = inputValue ? inputOperator : '=';

    if (!this.isManyLink) {
      if (!compareValues(this.data[attribute], operator, value)) {
        this.data = null;
      }
    }
    if (this.isManyLink) {
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
    return this.join(name, null, true);
  }

  join(rawName, constraints = null, shallow = false) {
    const name = getName(rawName);
    const isStringName = typeof rawName === 'string' || rawName instanceof String;
    const resultName = isStringName ? rawName : rawName[0];

    if (this.isManyLink) {
      this.data.forEach((attributes, key) => {
        if (this.data[key]) {
          this.data[key][resultName] = getRelationData(
            // eslint-disable-next-line no-underscore-dangle
            this.data[key].__typename,
            this.data[key].id,
            name,
            this.state,
            constraints,
            shallow,
          );
        }
      });
    } else if (this.data) {
      this.data[resultName] = getRelationData(
        // eslint-disable-next-line no-underscore-dangle
        this.data.__typename,
        this.data.id,
        name,
        this.state,
        constraints,
        shallow,
      );
    }

    return this;
  }

  getData() {
    return this.data;
  }
}
