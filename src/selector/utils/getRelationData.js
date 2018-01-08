import Selector from './../Selector';
import isManyLink from '../../utils/isManyLink';
import formatData from './formatData';
import SelectorError from '../SelectorError';

export default function getRelationData(type, id, name, state, constraints, shallow) {
  // log warning if relation does not exist
  if (
    !state.entities[type][id][name] ||
    (state.entities[type][id][name] && state.entities[type][id][name].linked === undefined)
  ) {
    throw new SelectorError('MISSING_JOINED_RELATION', { type, id, name });
  }

  // relation is set to null
  if (state.entities[type][id][name].linked === null) {
    return null;
  }

  const childrenTypeIds = state.entities[type][id][name].linked;

  // only select shallow linked entities
  if (shallow) {
    if (!isManyLink(childrenTypeIds)) {
      return formatData(childrenTypeIds[0], childrenTypeIds[1], state.entities, true);
    }

    return childrenTypeIds
      .map(childrenId => formatData(childrenId[0], childrenId[1], state.entities, true))
      .filter(item => item !== undefined);
  }

  // select full entity
  const selector = constraints
    ? constraints(new Selector(state, childrenTypeIds))
    : new Selector(state, childrenTypeIds);

  return selector.getData();
}
