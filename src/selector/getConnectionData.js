import Selector from './Selector';

export default function getConnectionData(state, id, name, constraints) {
  const childrenIds =
    !state.entities[id[0]][id[1]][name] || !state.entities[id[0]][id[1]][name].connection
      ? []
      : state.entities[id[0]][id[1]][name].connection;

  const selector = constraints
    ? constraints(new Selector(state, childrenIds))
    : new Selector(state, childrenIds);

  return selector.getData();
}
