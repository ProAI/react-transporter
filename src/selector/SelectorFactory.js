import Selector from './Selector';

export default class SelectorFactory {
  constructor(state) {
    this.state = state;
  }

  select(ids) {
    return new Selector(this.state, ids);
  }

  selectByAlias(name) {
    if (!this.state.aliases[name]) {
      throw new Error(`Cannot find alias '${name}'.`);
    }

    const aliasIds = this.state.aliases[name];

    return new Selector(this.state, aliasIds);
  }

  selectChildren(id, name) {
    if (!this.state.entities[id[0]] || !this.state.entities[id[0]][id[1]]) {
      throw new Error(`Cannot find connection '${name}' of entity [${id[0]}, ${id[1]}].`);
    }

    const childrenIds =
      !this.state.entities[id[0]][id[1]][name] ||
      !this.state.entities[id[0]][id[1]][name].connection
        ? []
        : this.state.entities[id[0]][id[1]][name].connection;

    return new Selector(this.state, childrenIds);
  }
}
