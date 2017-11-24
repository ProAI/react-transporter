import StoreUpdater from './StoreUpdater';

export default class ActionCollector {
  actionsOnRoots = [];
  actionsOnEntities = [];

  applyResponse(response) {
    if (response.roots) {
      this.actionsOnRoots.push({
        type: 'APPLY_RESPONSE',
        data: { ...response.roots },
      });
    }

    if (response.entities) {
      this.actionsOnEntities.push({
        type: 'APPLY_RESPONSE',
        data: { ...response.entities },
      });
    }
  }

  applyUpdater(updater, response) {
    updater(new StoreUpdater(this), response);
  }

  insertEntity(entity) {
    this.actionsOnEntities.push({
      type: 'INSERT_ENTITY',
      entity,
    });
  }

  updateEntity(entity, data) {
    this.actionsOnEntities.push({
      type: 'UPDATE_ENTITY',
      entity,
      data,
    });
  }

  deleteEntity(entity) {
    this.actionsOnEntities.push({
      type: 'DELETE_ENTITY',
      entity,
    });
  }

  updateConnection(ref, linkedEntity) {
    this.addConnectionAction(ref, {
      type: 'UPDATE_CONNECTION',
      linkedEntity,
    });
  }

  updateManyConnection(ref, method, linkedEntities) {
    this.addConnectionAction(ref, {
      type: 'UPDATE_MANY_CONNECTION',
      method,
      linkedEntities,
    });
  }

  addConnectionAction = (ref, action) => {
    if (ref.root) {
      this.actionsOnRoots.push({
        name: ref.name,
        ...action,
      });
    } else {
      this.actionsOnEntities.push({
        entity: ref.entity,
        name: ref.name,
        ...action,
      });
    }
  };

  getActions() {
    return {
      roots: this.actionsOnRoots,
      entities: this.actionsOnEntities,
    };
  }
}
