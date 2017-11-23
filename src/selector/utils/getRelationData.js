import Selector from './../Selector';
import hasManyEntities from '../../utils/hasManyEntities';

export default function getRelationData(state, id, name, constraints, shallow = false) {
  const childrenIds =
    !state.entities[id[0]][id[1]][name] || !state.entities[id[0]][id[1]][name].linked
      ? []
      : state.entities[id[0]][id[1]][name].linked;

  if (shallow) {
    if (!hasManyEntities(childrenIds)) {
      return {
        id: childrenIds[1],
        __typename: childrenIds[0],
      };
    }

    return childrenIds.map(childrenId => ({
      id: childrenId[1],
      __typename: childrenId[0],
    }));
  }

  const selector = constraints
    ? constraints(new Selector(state, childrenIds))
    : new Selector(state, childrenIds);

  return selector.getData();
}
