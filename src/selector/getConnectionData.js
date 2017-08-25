import Selector from './Selector';

export default function getConnectionData(state, id, name, constraints = () => {}) {
  const childrenIds =
    !state.entities[id[0]][id[1]][name] || !state.entities[id[0]][id[1]][name].connection
      ? []
      : state.entities[id[0]][id[1]][name].connection;

  const selector = new Selector(state, childrenIds);
  constraints(selector);

  return selector.getData();
}
