import StoreQuery from './StoreQuery';
import makeSelectorError from './makeSelectorError';

export default class ReadStore {
  constructor(state) {
    this.state = state;
  }

  select(type, id) {
    if (!this.state.entities.data[type] || !this.state.entities.data[type][id]) {
      throw makeSelectorError('MISSING_ENTITY', { type, id });
    }

    return new StoreQuery(this.state, [type, id]);
  }

  selectFromRoot(name) {
    if (!this.state.roots.data[name]) {
      throw makeSelectorError('MISSING_ROOT', { name });
    }

    const rootIds = this.state.roots.data[name].link;

    return new StoreQuery(this.state, rootIds);
  }

  selectFromRelation(type, id, name) {
    if (!this.state.entities.data[type] || !this.state.entities.data[type][id]) {
      throw makeSelectorError('MISSING_RELATION', { type, id, name });
    }

    const childrenTypeIds = this.state.entities.data[type][id][name].link;

    return new StoreQuery(this.state, childrenTypeIds);
  }
}
