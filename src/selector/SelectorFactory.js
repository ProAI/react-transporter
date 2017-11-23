import Selector from './Selector';

export default class SelectorFactory {
  constructor(state) {
    this.state = state;
  }

  select(ids) {
    return new Selector(this.state, ids);
  }

  selectFromRoot(name) {
    if (!this.state.roots[name]) {
      throw new Error(`Cannot find root '${name}'.`);
    }

    const rootIds = this.state.roots[name];

    return new Selector(this.state, rootIds);
  }

  selectFromRelation(id, name) {
    if (!this.state.entities[id[0]] || !this.state.entities[id[0]][id[1]]) {
      throw new Error(`Cannot find entity [${id[0]}, ${id[1]}].`);
    }

    const childrenIds =
      !this.state.entities[id[0]][id[1]][name] || !this.state.entities[id[0]][id[1]][name].linked
        ? []
        : this.state.entities[id[0]][id[1]][name].linked;

    return new Selector(this.state, childrenIds);
  }
}
