import getKeyName from '../utils/getKeyName';
import isString from '../utils/isString';
import isConnection from '../utils/isConnection';
import isManyLink from '../utils/isManyLink';
import StoreError from '../errors/StoreError';

function compareValues(leftValue, operator, rightValue) {
  switch (operator) {
    case '=':
      return leftValue === rightValue;
    case '>':
      return leftValue > rightValue;
    case '>=':
      return leftValue >= rightValue;
    case '<':
      return leftValue < rightValue;
    case '<=':
      return leftValue <= rightValue;
    default:
      throw new StoreError(`Unknown operator '${operator}'`);
  }
}

function formatData(type, id, entities, shallow = false) {
  // log warning if entity does not exist
  if (!entities.data[type] || !entities.data[type][id]) {
    throw new StoreError('Joined entity not found.', [type, id]);
  }

  const attributes = {};

  // get full entity
  if (!shallow) {
    const entity = entities.data[type][id];

    if (entity) {
      Object.keys(entity).forEach(key => {
        if (!isConnection(entity[key])) {
          attributes[key] = entity[key];
        }
      });
    }
  }

  return {
    ...attributes,
    __typename: type,
    id,
  };
}

function getRelationData(type, id, name, state, constraints, shallow) {
  // log warning if relation does not exist
  if (!state.entities.data[type][id][name] || !isConnection(state.entities.data[type][id][name])) {
    throw new StoreError(`Joined relation "${name}" not found.`, [type, id]);
  }

  const childrenTypeIds = state.entities.data[type][id][name].link;

  // relation is set to null
  if (childrenTypeIds === null) {
    return null;
  }

  // only select shallow link entities
  if (shallow) {
    if (!isManyLink(childrenTypeIds)) {
      return formatData(childrenTypeIds[0], childrenTypeIds[1], state.entities, true);
    }

    return childrenTypeIds
      .map(childrenId => formatData(childrenId[0], childrenId[1], state.entities, true))
      .filter(item => item !== undefined);
  }

  // select full entity
  const selector = constraints
    ? // eslint-disable-next-line no-use-before-define
      constraints(new StoreQuery(state, childrenTypeIds))
    : // eslint-disable-next-line no-use-before-define
      new StoreQuery(state, childrenTypeIds);

  return selector.getData();
}

export default class StoreQuery {
  constructor(state, typeIdOrIds) {
    this.isManyLink = isManyLink(typeIdOrIds);

    this.data = this.isManyLink
      ? typeIdOrIds
          .map(typeId => formatData(typeId[0], typeId[1], state.entities))
          .filter(item => item !== undefined)
      : formatData(typeIdOrIds[0], typeIdOrIds[1], state.entities);

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
    const name = getKeyName(rawName);
    const resultName = isString(rawName) ? rawName : rawName[0];

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
