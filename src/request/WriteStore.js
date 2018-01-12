import createNameWithArgs from './utils/createNameWithArgs';
import isConnection from '../utils/isConnection';
import isManyLink from '../utils/isManyLink';
import getRawLink from './utils/getRawLink';
import Link from './Link';
import ManyLink from './ManyLink';
import Entity from './Entity';
import makeRequestError from './makeRequestError';

function entityExists(type, id, storedEntities, data) {
  return (
    (storedEntities[type] && storedEntities[type][id]) ||
    (data.entities[type] && data.entities[type][id])
  );
}

function prepareRootValue(value, originalValue) {
  return getRawLink(typeof value === 'function'
    ? value(isManyLink(originalValue.link) ? new ManyLink(originalValue) : new Link(originalValue))
    : value);
}

function checkRootValue(value, originalValue, variables) {
  // check if value is connection value
  if (!value || !isConnection(value)) {
    throw makeRequestError('WRONG_ROOT_VALUE');
  }

  // check connection type
  if (isConnection(originalValue)) {
    if (isManyLink(originalValue.link) && !isManyLink(value.link)) {
      throw makeRequestError('WRONG_ROOT_MANYLINK_VALUE', variables);
    }
    if (!isManyLink(originalValue.link) && isManyLink(value.link)) {
      throw makeRequestError('WRONG_ROOT_LINK_VALUE', variables);
    }
  }
}

export default class WriteStore {
  constructor(state, response) {
    this.state = state;
    this.data = response || {
      entities: {},
      roots: {},
      trash: [],
    };
  }

  insert(type, id, setAttributes) {
    if (entityExists(type, id, this.state.entities.data, this.data)) {
      throw makeRequestError('EXISTING_ENTITY_INSERT', { type, id });
    }

    const entity = new Entity(type, id);

    setAttributes(entity);
    if (!this.data.entities[type]) this.data.entities[type] = {};
    this.data.entities[type][id] = entity.values;
  }

  update(type, id, setAttributes) {
    if (!entityExists(type, id, this.state.entities.data, this.data)) {
      throw makeRequestError('MISSING_ENTITY_UDPATE', { type, id });
    }

    const entity = new Entity(type, id, this.state.entities.data[type][id]);

    setAttributes(entity);
    if (!this.data.entities[type]) this.data.entities[type] = {};
    this.data.entities[type][id] = entity.values;
  }

  delete(type, id) {
    if (!entityExists(type, id, this.state.entities.data, this.data)) {
      throw makeRequestError('MISSING_ENTITY_UDPATE', { type, id });
    }

    this.data.trash.push([type, id]);
  }

  setRoot(baseName, args, tempValue) {
    const name = createNameWithArgs(baseName, tempValue ? args : undefined);

    const value = prepareRootValue(tempValue || args, this.state.roots.data[name]);

    checkRootValue(value, this.state.roots.data[name], { name });

    this.data.roots[name] = value;
  }
}
