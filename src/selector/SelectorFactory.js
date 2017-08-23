import Selector from './Selector';
import formatEntity from './formatEntity';

function hasMany(ids) {
  return typeof ids[0] === 'string' || ids[0] instanceof String;
}

export default class SelectorFactory {
  constructor(state) {
    this.state = state;
  }

  select(id) {
    if (!this.state.entities[id[0]] || !this.state.entities[id[0]][id[1]]) {
      throw new Error(`Cannot find entity [${id[0]}, ${id[1]}].`);
    }

    const entities = [formatEntity(id, this.state.entities[id[0]][id[1]])];

    return new Selector(this.state, entities);
  }

  selectByAlias(name) {
    if (!this.state.aliases[name]) {
      throw new Error(`Cannot find alias '${name}'.`);
    }

    const aliasIds = this.state.aliases[name];

    const entities = hasMany(aliasIds)
      ? formatEntity(aliasIds, this.state.entities[aliasIds[0]][aliasIds[1]])
      : aliasIds.map(id => formatEntity(id, this.state.entities[id[0]][id[1]]));

    return new Selector(this.state, entities);
  }

  selectChildren(id, name) {
    if (
      !this.state.entities[id[0]] ||
      !this.state.entities[id[0]][id[1]] ||
      !this.state.entities[id[0]][id[1]][name] ||
      !this.state.entities[id[0]][id[1]][name].connection
    ) {
      throw new Error(`Cannot find connection '${name}' of entity [${id[0]}, ${id[1]}].`);
    }

    const childrenIds = this.state.entities[id[0]][id[1]][name].connection;

    const entities = hasMany(childrenIds)
      ? formatEntity(childrenIds, this.state.entities[childrenIds[0]][childrenIds[1]])
      : childrenIds.map(childrenId =>
        formatEntity(childrenId, this.state.entities[childrenId[0]][childrenId[1]]),
      );

    return new Selector(this.state, entities);
  }
}
