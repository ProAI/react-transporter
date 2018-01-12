import createNameWithArgs from './utils/createNameWithArgs';
import isConnection from '../utils/isConnection';
import isManyLink from '../utils/isManyLink';
import getRawLink from './utils/getRawLink';
import Link from './Link';
import ManyLink from './ManyLink';
import makeRequestError from './makeRequestError';

function prepareValue(value, entity, name) {
  const returnValue = typeof value === 'function' ? value(entity.get(name)) : value;

  if (isConnection(returnValue)) {
    return getRawLink(returnValue);
  }

  return returnValue;
}

function checkValue(value, originalValue, variables) {
  // check field type
  if (isConnection(originalValue) && !isConnection(value)) {
    throw makeRequestError('WRONG_CONNECTION_FIELD_VALUE');
  }
  if (!isConnection(originalValue) && isConnection(value)) {
    throw makeRequestError('WRONG_SCALAR_FIELD_VALUE', variables);
  }

  // check connection type
  if (isConnection(originalValue) && isConnection(value)) {
    if (isManyLink(originalValue.link) && !isManyLink(value.link)) {
      throw makeRequestError('WRONG_CONNECTION_MANYLINK_FIELD_VALUE', variables);
    }
    if (!isManyLink(originalValue.link) && isManyLink(value.link)) {
      throw makeRequestError('WRONG_CONNECTION_LINK_FIELD_VALUE', variables);
    }
  }
}

export default class Entity {
  constructor(type, id, originalValues) {
    this.type = type;
    this.id = id;
    this.originalValues = originalValues;
    this.values = {};
  }

  get(name) {
    if (!this.values[name] && (this.originalValues && !this.originalValues[name])) {
      throw makeRequestError('MISSING_FIELD', { type: this.type, id: this.id, name });
    }

    // get new or original value
    const value = this.values[name] || this.originalValues[name];

    // return connection value
    if (isConnection(value)) {
      return isManyLink(value.link) ? new ManyLink(value) : new Link(value);
    }

    // return scalar value
    return value;
  }

  set(baseName, args, tempValue = null) {
    const name = createNameWithArgs(baseName, tempValue ? args : undefined);
    const value = prepareValue(tempValue || args, this, name);

    // check correct type
    if (this.originalValues && this.originalValues[name]) {
      checkValue(value, this.originalValues[name], { type: this.type, id: this.id, name });
    }

    this.values[name] = value;
  }

  fill(values) {
    Object.keys(values).forEach((name) => {
      const value = prepareValue(values[name], this, name);

      // check correct type
      if (this.originalValues && this.originalValues[name]) {
        checkValue(value, this.originalValues[name], { type: this.type, id: this.id, name });
      }

      this.values[name] = value;
    });
  }
}