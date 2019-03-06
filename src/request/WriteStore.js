import getKeyName from '../utils/getKeyName';
import Entity, { validateFieldValue, prepareFieldValue, getFieldValue } from './Entity';
import StoreError from '../errors/StoreError';

function validateInsert(data, optimistic, link) {
  if (data) {
    const error = 'Cannot insert entity, because entity already exists.';

    throw new StoreError(error, link);
  }

  if (optimistic && optimistic.type === 'DELETE') {
    const error = 'Cannot perform insert on optimistically deleted entity.';

    throw new StoreError(error, link);
  }
}

function validateUpdate(data, optimistic, link) {
  if (!data) {
    const error =
      optimistic && optimistic.type === 'DELETE'
        ? 'Cannot perform update on optimistically deleted entity.'
        : 'Cannot update entity, because entity does not exist.';

    throw new StoreError(error, link);
  }

  if (optimistic && optimistic.type === 'CREATE') {
    const error = 'Cannot perform update on optimistically created entity.';

    throw new StoreError(error, link);
  }
}

function validateDelete(data, optimistic, link) {
  if (!data) {
    const error =
      optimistic && optimistic.type === 'DELETE'
        ? 'Cannot perform delete on optimistically deleted entity.'
        : 'Cannot delete entity, because entity does not exist.';

    throw new StoreError(error, link);
  }

  if (optimistic && optimistic.type === 'CREATE') {
    const error = 'Cannot perform delete on optimistically created entity.';

    throw new StoreError(error, link);
  }
}

export default class WriteStore {
  constructor(state, data) {
    this.state = state;
    this.data = {
      entities: (data && data.entities) || {},
      roots: (data && data.roots) || {},
      trash: [],
    };
  }

  insert(type, id, setAttributes) {
    const data = this.getData(type, id);
    const optimistic = this.getOptimistic(type, id);

    validateInsert(data, optimistic, [type, id]);

    const entity = new Entity(type, id);

    setAttributes(entity);
    if (!this.data.entities[type]) this.data.entities[type] = {};
    this.data.entities[type][id] = entity.values;
  }

  update(type, id, setAttributes) {
    const data = this.getData(type, id);
    const optimistic = this.getOptimistic(type, id);

    validateUpdate(data, optimistic, [type, id]);

    const entity = new Entity(type, id, data, optimistic);

    setAttributes(entity);
    if (!this.data.entities[type]) this.data.entities[type] = {};

    this.data.entities[type][id] = this.data.entities[type][id]
      ? Object.assign({}, this.data.entities[type][id], entity.values)
      : entity.values;
  }

  delete(type, id) {
    const data = this.getData(type, id);
    const optimistic = this.getOptimistic(type, id);

    validateDelete(data, optimistic, [type, id]);

    this.data.trash.push([type, id]);
  }

  setRoot(rawName, rawValue) {
    const name = getKeyName(rawName);

    const currentValue = getFieldValue(
      name,
      this.data.roots[name],
      this.state.roots[name],
      this.state.roots.optimistic,
    );
    const value = prepareFieldValue(name, rawValue, currentValue);

    validateFieldValue(name, value, currentValue, 'root');

    this.data.roots[name] = value;
  }

  getData(type, id) {
    const { data } = this.state.entities;

    return data[type] && data[type][id];
  }

  getOptimistic(type, id) {
    const { optimistic } = this.state.entities;

    return optimistic[type] && optimistic[type][id];
  }

  toSource() {
    const obj = {};

    if (Object.keys(this.data.entities).length !== 0) {
      obj.entities = this.data.entities;
    }

    if (Object.keys(this.data.roots).length !== 0) {
      obj.roots = this.data.roots;
    }

    if (this.data.trash.length !== 0) {
      obj.trash = this.data.trash;
    }

    return obj;
  }
}
