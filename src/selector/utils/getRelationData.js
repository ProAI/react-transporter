import Selector from './../Selector';
import hasManyEntities from '../../utils/hasManyEntities';
import formatData from './formatData';
import { logSelectRelationWarning } from './handleErrors';

export default function getRelationData(type, id, name, state, constraints, shallow) {
  // relation does not exist
  if (
    !state.entities[type][id][name] ||
    (state.entities[type][id][name] && state.entities[type][id][name].linked === undefined)
  ) {
    // eslint-disable-next-line no-console
    console.log(state.entities[type][id][name]);
    logSelectRelationWarning(type, id, name);
    return undefined;
  }

  // relation is set to null
  if (state.entities[type][id][name].linked === null) {
    return null;
  }

  const childrenTypeIds = state.entities[type][id][name].linked;

  if (shallow) {
    if (!hasManyEntities(childrenTypeIds)) {
      return formatData(childrenTypeIds[0], childrenTypeIds[1]);
    }

    return childrenTypeIds.map(childrenId => formatData(childrenId[0], childrenId[1]));
  }

  const selector = constraints
    ? constraints(new Selector(state, childrenTypeIds))
    : new Selector(state, childrenTypeIds);

  return selector.getData();
}
