import StoreQuery from './StoreQuery';
import StoreError from '../errors/StoreError';
import getKeyName from '../utils/getKeyName';

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
      throw new StoreError('Selected entity not found.', [type, id]);
    }

    return getData(this.state, [type, id], query);
  }

  selectByRoot(rawName, query) {
    const name = getKeyName(rawName);

    if (!this.state.roots.data[name]) {
      throw new StoreError(`Selected root '${name}' not found.`, 'root');
    }

    const rootTypeIdOrIds = this.state.roots.data[name].link;

    return getData(this.state, rootTypeIdOrIds, query);
  }

  selectByRelation(type, id, rawName, query) {
    const name = getKeyName(rawName);

    if (
      !this.state.entities.data[type] ||
      !this.state.entities.data[type][id] ||
      !this.state.entities.data[type][id][name]
    ) {
      throw new StoreError(`Selected relation '${name}' not found.`, [type, id]);
    }

    const childrenTypeIdOrIds = this.state.entities.data[type][id][name].link;

    return getData(this.state, childrenTypeIdOrIds, query);
  }
}
