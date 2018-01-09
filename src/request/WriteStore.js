import createNameWithArgs from './utils/createNameWithArgs';
import isManyLink from '../utils/isManyLink';
import getRawLink from './utils/getRawLink';
import Link from './Link';
import ManyLink from './ManyLink';
import Entity from './Entity';
import RequestError from './RequestError';

function entityExists(type, id, stateData, data) {
  return (
    (stateData.entities[type] && stateData.entities[type][id]) ||
    (data.entities[type] && data.entities[type][id])
  );
}

function rootExists(name, stateData, data) {
  return stateData.roots[name] || data.roots[name];
}

function prepareRootValue(tempValue, currentValue) {
  const value =
    typeof tempValue === 'function'
      ? tempValue(isManyLink(currentValue) ? new ManyLink(currentValue) : new Link(currentValue))
      : tempValue;

  return getRawLink(value);
}

function checkRootValue(name, originalValue, value) {
  // check if value is connection value
  if (!value.link) {
    throw new RequestError('WRONG_ROOT_VALUE', { name });
  }

  // check connection type
  if (isManyLink(originalValue) && !isManyLink(value)) {
    throw new RequestError('WRONG_ROOT_MANYLINK_VALUE', { name });
  }
  if (!isManyLink(originalValue) && isManyLink(value)) {
    throw new RequestError('WRONG_ROOT_LINK_VALUE', { name });
  }
}

export default class WriteStore {
  constructor(state, response, optimistic) {
    this.state = state.transporter;
    this.data = response;
    this.optimistic = optimistic;
  }

  insert(type, id, setAttributes) {
    if (entityExists(type, id, this.state.data, this.data)) {
      throw new RequestError('EXISTING_ENTITY_INSERT', { type, id });
    }

    const entity = new Entity(type, id);

    setAttributes(entity);
    if (!this.data.entities[type]) this.data.entities[type] = {};
    this.data.entities[type][id] = entity.values;
  }

  update(type, id, setAttributes) {
    if (!entityExists(type, id, this.state.data, this.data)) {
      throw new RequestError('MISSING_ENTITY_UDPATE', { type, id });
    }

    const entity = new Entity(type, id, this.state.data.entities[type][id]);

    setAttributes(entity);
    if (!this.data.entities[type]) this.data.entities[type] = {};
    this.data.entities[type][id] = entity.values;
  }

  delete(type, id) {
    if (!entityExists(type, id, this.state.data, this.data)) {
      throw new RequestError('MISSING_ENTITY_UDPATE', { type, id });
    }

    this.data.trashed.push([type, id]);
  }

  setRoot(baseName, args, tempValue) {
    const name = createNameWithArgs(baseName, args);

    if (!rootExists(name, this.state.data, this.data)) {
      throw new RequestError('MISSING_ROOT', { name });
    }

    const value = prepareRootValue(tempValue || args, this.state.data.roots[name]);

    checkRootValue(name, value, this.state.data.roots[name]);

    this.data.roots[name] = value;
  }
}
