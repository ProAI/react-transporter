import StoreQuery from './StoreQuery';
import makeSelectorError from './makeSelectorError';
import getName from '../utils/getName';

function getData(state, typeIdOrIds, query) {
  const store = new StoreQuery(state, typeIdOrIds);

  return (query ? query(store) : store).getData();
}

export default class ReadStore {
  constructor(state) {
    this.state = state;
  }

  select(type, id, query) {
    if (!this.state.entities.data[type] || !this.state.entities.data[type][id]) {
      throw makeSelectorError('MISSING_ENTITY', { type, id });
    }

    return getData(this.state, [type, id], query);
  }

  selectByRoot(rawName, query) {
    const name = getName(rawName);

    if (!this.state.roots.data[name]) {
      throw makeSelectorError('MISSING_ROOT', { name });
    }

    const rootTypeIdOrIds = this.state.roots.data[name].link;

    return getData(this.state, rootTypeIdOrIds, query);
  }

  selectByRelation(type, id, rawName, query) {
    const name = getName(rawName);

    if (
      !this.state.entities.data[type] ||
      !this.state.entities.data[type][id] ||
      !this.state.entities.data[type][id][name]
    ) {
      throw makeSelectorError('MISSING_RELATION', { type, id, name });
    }

    const childrenTypeIdOrIds = this.state.entities.data[type][id][name].link;

    return getData(this.state, childrenTypeIdOrIds, query);
  }
}
