import getKeyName from '../utils/getKeyName';
import isConnection from '../utils/isConnection';
import isManyLink from '../utils/isManyLink';
import Link from './Link';
import ManyLink from './ManyLink';
import StoreError from '../errors/StoreError';

function isDate(obj) {
  return Object.prototype.toString.call(obj) === '[object Date]';
}

function getCurrentFieldValue(name, data, originalData, optimistic) {
  if (data[name] !== undefined) {
    return data[name];
  }

  if (optimistic && optimistic.type === 'UPDATE' && optimistic.data[name] !== undefined) {
    return optimistic.data[name].originalValue;
  }

  return originalData[name];
}

export function getFieldValue(name, data, originalData, optimistic) {
  const currentValue = getCurrentFieldValue(name, data, originalData, optimistic);

  // return connection value
  if (isConnection(currentValue)) {
    return isManyLink(currentValue.link) ? new ManyLink(currentValue) : new Link(currentValue);
  }

  // return scalar value
  return currentValue;
}

export function prepareFieldValue(name, currentValue, value) {
  const returnValue = typeof value === 'function' ? value(currentValue) : value;

  if (isConnection(returnValue)) {
    return returnValue.toSource();
  }

  if (isDate(returnValue)) {
    return returnValue.toISOString();
  }

  return returnValue;
}

export function validateFieldValue(name, currentValue, value, link) {
  if (currentValue === undefined) {
    return;
  }

  // check field type
  if (isConnection(currentValue) && !isConnection(value)) {
    const error = `Cannot set field "${name}", because it needs a scalar value, not a connection.`;
    throw new StoreError(error, link);
  }
  if (!isConnection(currentValue) && isConnection(value)) {
    const error = `Cannot set field "${name}", because it needs a connection, not a scalar value.`;
    throw new StoreError(error, link);
  }

  // check connection type
  if (isConnection(currentValue) && isConnection(value)) {
    if (isManyLink(currentValue.link) && !isManyLink(value.link)) {
      const error = `Cannot set field "${name}", because it is of type ManyLink, not Link.`;
      throw new StoreError(error, link);
    }
    if (!isManyLink(currentValue.link) && isManyLink(value.link)) {
      const error = `Cannot set field "${name}", because it is of type Link, not ManyLink.`;
      throw new StoreError(error, link);
    }
  }
}

export default class Entity {
  constructor(type, id, originalData, optimistic) {
    this.type = type;
    this.id = id;

    this.originalData = originalData || {};
    this.data = {};

    this.optimistic = optimistic;
  }

  get(name) {
    if (this.data[name] === undefined && this.originalData[name] === undefined) {
      const error = `Cannot get field "${name}", because it does not exist.`;
      throw new StoreError(error, [this.type, this.id]);
    }

    return getFieldValue(name, this.data[name], this.originalData[name], this.optimistic);
  }

  // Alias for set, because of flowtype problem.
  setDistinct(rawName, rawValue = null) {
    this.set(rawName, rawValue);
  }

  set(rawName, rawValue = null) {
    const name = getKeyName(rawName);
    const currentValue = getFieldValue(name, this.data, this.originalData, this.optimistic);
    const value = prepareFieldValue(name, currentValue, rawValue);

    validateFieldValue(name, currentValue, value, [this.type, this.id]);

    this.data[name] = value;
  }

  fill(values) {
    Object.keys(values).forEach(name => {
      this.set(name, values[name]);
    });
  }
}
