import ConnectionUpdater from './ConnectionUpdater';
import EntityUpdater from './EntityUpdater';

export default class Updater {
  constructor(actions) {
    this.actions = actions;
  }

  root(name) {
    const ref = {
      root: true,
      name,
    };

    return new ConnectionUpdater(ref, this.actions);
  }

  insert(entityType, entityId) {
    this.actions.insertEntity([entityType, entityId]);

    return new EntityUpdater(entityType, entityId, this.actions);
  }

  update(entityType, entityId) {
    return new EntityUpdater(entityType, entityId, this.actions);
  }

  delete(entityType, entityId) {
    this.actions.deleteEntity([entityType, entityId]);
  }
}
