import getKeyName from '../utils/getKeyName';
import Entity, { validateFieldValue, prepareFieldValue, getFieldValue } from './Entity';
import StoreError from '../errors/StoreError';
import EntityMap from '../utils/EntityMap';

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
  constructor(state, response) {
    this.data = {
      entities: new EntityMap(state.entities.data),
      roots: state.roots.data,
    };

    this.optimistic = {
      entities: new EntityMap(state.entities.optimistic),
      roots: state.roots.optimistic,
    };

    this.response = {
      entities: new EntityMap(response && response.entities),
      roots: (response && response.roots) || {},
      trash: [],
    };
  }

  insert(type, id, setAttributes) {
    const data = this.data.entities.get(type, id);
    const optimistic = this.optimistic.entities.get(type, id);

    validateInsert(data, optimistic, [type, id]);

    const entity = new Entity(type, id);
    setAttributes(entity);

    this.response.entities.set(type, id, entity.data);
  }

  update(type, id, setAttributes) {
    const data = this.data.entities.get(type, id);
    const optimistic = this.optimistic.entities.get(type, id);

    validateUpdate(data, optimistic, [type, id]);

    const entity = new Entity(type, id, data, optimistic);
    setAttributes(entity);

    const response = this.response.entities.get(type, id);
    const updatedResponse = response ? { ...response, ...entity.data } : entity.data;

    this.response.entities.set(type, id, updatedResponse);
  }

  delete(type, id) {
    const data = this.data.entities.get(type, id);
    const optimistic = this.optimistic.entities.get(type, id);

    validateDelete(data, optimistic, [type, id]);

    this.response.trash.push([type, id]);
  }

  setRoot(rawName, rawValue) {
    const name = getKeyName(rawName);

    const currentValue = getFieldValue(
      name,
      this.response.roots,
      this.data.roots,
      this.optimistic.roots,
    );

    const value = prepareFieldValue(name, currentValue, rawValue);

    validateFieldValue(name, currentValue, value, 'root');

    this.response.roots[name] = value;
  }

  toSource() {
    const source = {};

    const entities = this.response.entities.toSource();
    if (Object.keys(entities).length > 0) {
      source.entities = entities;
    }

    const { roots } = this.response;
    if (Object.keys(roots).length > 0) {
      source.roots = roots;
    }

    const { trash } = this.response;
    if (trash.length > 0) {
      source.trash = trash;
    }

    return source;
  }
}
