import Selector from './Selector';
import { throwSelectRootError, throwSelectEntityError } from './utils/handleErrors';

export default class SelectorFactory {
  constructor(state) {
    this.state = state;
  }

  select(type, id) {
    return new Selector(this.state, [type, id]);
  }

  selectFromRoot(name) {
    if (!this.state.roots[name]) {
      throwSelectRootError(name);
    }

    const rootIds = this.state.roots[name].linked;

    return new Selector(this.state, rootIds);
  }

  selectFromRelation(type, id, name) {
    if (!this.state.entities[type] || !this.state.entities[type][id]) {
      throwSelectEntityError(type, id);
    }

    const childrenTypeIds =
      !this.state.entities[type][id][name] || !this.state.entities[type][id][name].linked
        ? []
        : this.state.entities[type][id][name].linked;

    return new Selector(this.state, childrenTypeIds);
  }
}
