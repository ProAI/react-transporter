import ConnectionUpdater from './ConnectionUpdater';

export default class EntityUpdater {
  constructor(type, id, actions) {
    this.type = type;
    this.id = id;
    this.actions = actions;
  }

  set(name, value) {
    const data =
      typeof name === 'string' || name instanceof String
        ? {
          [name]: value,
        }
        : name;

    this.actions.updateEntity([this.type, this.id], data);
  }

  relation(name) {
    const ref = {
      root: false,
      entity: [this.type, this.id],
      name,
    };

    return new ConnectionUpdater(ref, this.actions);
  }
}
