import getKeyName from '../utils/getKeyName';
import isString from '../utils/isString';
import isConnection from '../utils/isConnection';
import isManyLink from '../utils/isManyLink';
import StoreError from '../errors/StoreError';
// eslint-disable-next-line import/no-cycle
import { getData } from './ReadStore';

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

function formatData(type, id, entities) {
  const entity = entities.get(type, id);

  if (!entity) {
    throw new StoreError('Joined entity not found.', [type, id]);
  }

  const attributes = {
    __typename: type,
    id,
  };

  Object.keys(entity).forEach((key) => {
    if (!isConnection(entity[key])) {
      attributes[key] = entity[key];
    }
  });

  return attributes;
}

function getRelationData(type, id, name, constraints, entities) {
  const entity = entities.get(type, id);

  if (!entity[name]) {
    throw new StoreError(`Joined relation "${name}" not found.`, [type, id]);
  }

  if (!isConnection(entity[name])) {
    throw new StoreError(`Joined relation "${name}" is not a connection.`, [
      type,
      id,
    ]);
  }

  // Relation is set to null.
  if (entity[name].link === null) {
    return null;
  }

  return getData(entity[name].link, constraints, entities);
}

function addAliases(entity, aliases) {
  const result = { ...entity };

  Object.entries(aliases).forEach(([key, alias]) => {
    result[alias] = entity[key];
  });

  return result;
}

export default class StoreQuery {
  constructor(link, entities) {
    this.link = link;

    this.isManyLink = isManyLink(link);

    this.data = this.isManyLink
      ? link.map((item) => formatData(...item, entities))
      : formatData(...link, entities);

    this.entities = entities;

    this.aliases = {};
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
      this.data = this.data.filter((data) =>
        compareValues(data[attribute], operator, value),
      );
    }

    return this;
  }

  alias(rawName) {
    const name = isString(rawName) ? rawName : rawName[0];

    this.aliases[getKeyName(rawName)] = name;

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

  join(rawName, constraints = null) {
    const name = getKeyName(rawName);
    const resultName = isString(rawName) ? rawName : rawName[0];

    if (this.isManyLink) {
      this.link.forEach((attributes, key) => {
        const data = getRelationData(
          ...this.link[key],
          name,
          constraints,
          this.entities,
        );
        this.data[key][resultName] = data;
      });
    } else {
      const data = getRelationData(
        ...this.link,
        name,
        constraints,
        this.entities,
      );
      this.data[resultName] = data;
    }

    return this;
  }

  getData() {
    if (!this.aliases || !this.data) {
      return this.data;
    }

    if (this.isManyLink) {
      return this.data.map((data) => addAliases(data, this.aliases));
    }

    return addAliases(this.data, this.aliases);
  }
}
