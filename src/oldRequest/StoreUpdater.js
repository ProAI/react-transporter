import ConnectionUpdater from './ConnectionUpdater';
import EntityUpdater from './EntityUpdater';

export default class Updater {
  constructor(actions) {
    this.actions = actions;
  }

  updateRoot(name) {
    const ref = {
      root: true,
      name,
    };

    return new ConnectionUpdater(ref, this.actions);
  }

  insert(entityType, entityId, createEntity) {
    this.actions.insertEntity([entityType, entityId], createEntity);
  }

  update(entityType, entityId, updateEntity) {
    this.actions.updateEntity([entityType, entityId], updateEntity);
  }

  delete(entityType, entityId) {
    this.actions.deleteEntity([entityType, entityId]);
  }
}
