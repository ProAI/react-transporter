import getEntitiesFromArgs from './utils/getEntitiesFromArgs';

export default class ConnectionUpdater {
  constructor(ref, actions) {
    this.ref = ref;
    this.actions = actions;
  }

  link(linkedEntityType, linkedEntityId) {
    this.actions.updateConnection(this.ref, [linkedEntityType, linkedEntityId]);
  }

  unlink() {
    this.actions.updateConnection(this.ref, null);
  }

  syncPrepend(...args) {
    const linkedEntities = getEntitiesFromArgs(args);
    this.actions.updateManyConnection(this.ref, 'sync_prepend', linkedEntities);
  }

  syncAppend(...args) {
    const linkedEntities = getEntitiesFromArgs(args);
    this.actions.updateManyConnection(this.ref, 'sync_append', linkedEntities);
  }

  prepend(...args) {
    const linkedEntities = getEntitiesFromArgs(args);
    this.actions.updateManyConnection(this.ref, 'prepend', linkedEntities);
  }

  append(...args) {
    const linkedEntities = getEntitiesFromArgs(args);
    this.actions.updateManyConnection(this.ref, 'append', linkedEntities);
  }

  detach(...args) {
    const linkedEntities = getEntitiesFromArgs(args);
    this.actions.updateManyConnection(this.ref, 'detach', linkedEntities);
  }
}
