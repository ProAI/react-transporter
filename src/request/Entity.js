import createNameWithArgs from './utils/createNameWithArgs';
import isManyLink from '../utils/isManyLink';
import getRawLink from './utils/getRawLink';
import Link from './Link';
import ManyLink from './ManyLink';
import RequestError from './RequestError';

function prepareValue(tempValue, currentValue) {
  const value = typeof tempValue === 'function' ? tempValue(currentValue) : tempValue;

  if (value.link) {
    return getRawLink(value);
  }

  return value;
}

function checkValue(type, id, name, originalValue, value) {
  // check field type
  if (originalValue.link && !value.link) {
    throw new RequestError('WRONG_CONNECTION_FIELD_VALUE', { type, id, name });
  }
  if (!originalValue.link && value.link) {
    throw new RequestError('WRONG_SCALAR_FIELD_VALUE', { type, id, name });
  }

  // check connection type
  if (originalValue.link && value.link) {
    if (isManyLink(originalValue) && !isManyLink(value)) {
      throw new RequestError('WRONG_CONNECTION_MANYLINK_FIELD_VALUE', { type, id, name });
    }
    if (!isManyLink(originalValue) && isManyLink(value)) {
      throw new RequestError('WRONG_CONNECTION_LINK_FIELD_VALUE', { type, id, name });
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
      throw new RequestError('MISSING_FIELD', { type: this.type, id: this.id, name });
    }

    // get new or original value
    const value = this.values[name] || this.originalValues[name];

    // return connection value
    if (value.link) {
      return isManyLink(value) ? new ManyLink(value) : new Link(value);
    }

    // return scalar value
    return value;
  }

  set(baseName, args, tempValue = null) {
    const name = createNameWithArgs(baseName, args);
    const value = prepareValue(tempValue || args, this.get(name));

    // check correct type
    if (this.originalValues && this.originalValues[name]) {
      checkValue(this.type, this.id, name, this.originalValues[name], value);
    }

    this.values[name] = value;
  }

  fill(values) {
    Object.keys(values).forEach((name) => {
      const value = prepareValue(values[name], this.get(name));

      // check correct type
      if (this.originalValues && this.originalValues[name]) {
        checkValue(this.type, this.id, name, this.originalValues[name], value);
      }

      this.values[name] = value;
    });
  }
}
