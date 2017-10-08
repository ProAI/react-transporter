import Selector from './Selector';
import { hasMany } from '../utils';

export default function getChildrenData(state, id, name, constraints, shallow = false) {
  const childrenIds =
    !state.entities[id[0]][id[1]][name] || !state.entities[id[0]][id[1]][name].connection
      ? []
      : state.entities[id[0]][id[1]][name].connection;

  if (shallow) {
    if (!hasMany(childrenIds)) {
      return {
        id: childrenIds[0],
        __typename: childrenIds[1],
      };
    }

    return childrenIds.map(childrenId => ({
      id: childrenId[0],
      __typename: childrenId[1],
    }));
  }

  const selector = constraints
    ? constraints(new Selector(state, childrenIds))
    : new Selector(state, childrenIds);

  return selector.getData();
}
