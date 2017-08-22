import Selector from './Selector';
import formatEntity from './formatEntity';

export default class SelectorFactory {
  constructor(state) {
    this.state = state;
  }

  select(id) {
    const entities = [formatEntity(this.state.entities[id[0]][id[1]])];

    return new Selector(entities);
  }

  selectByAlias(name) {
    const aliasIds = this.state.aliases[name];

    const entities = aliasIds.map(id => formatEntity(this.state.entities[id[0]][id[1]]));

    return new Selector(entities);
  }

  selectChildren(id, name) {
    const childrenIds = this.state.entities[id[0]][id[1]][name].connection;

    const entities = childrenIds.map(childrenId =>
      formatEntity(this.state.entities[childrenId[0]][childrenId[1]]),
    );

    return new Selector(entities);
  }
}
