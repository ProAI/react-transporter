import Selector from './Selector';
import SelectorError from './SelectorError';

export default class ReadStore {
  constructor(state) {
    this.state = state;
  }

  select(type, id) {
    if (!this.state.entities.data[type] || !this.state.entities.data[type][id]) {
      throw new SelectorError('MISSING_ENTITY', { type, id });
    }

    return new Selector(this.state, [type, id]);
  }

  selectFromRoot(name) {
    if (!this.state.roots[name]) {
      throw new SelectorError('MISSING_ROOT', { name });
    }

    const rootIds = this.state.roots[name].linked;

    return new Selector(this.state, rootIds);
  }

  selectFromRelation(type, id, name) {
    if (!this.state.entities.data[type] || !this.state.entities.data[type][id]) {
      throw new SelectorError('MISSING_RELATION', { type, id, name });
    }

    const childrenTypeIds =
      !this.state.entities.data[type][id][name] || !this.state.entities.data[type][id][name].linked
        ? []
        : this.state.entities.data[type][id][name].linked;

    return new Selector(this.state, childrenTypeIds);
  }
}
