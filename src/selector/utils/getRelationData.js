import Selector from './../Selector';
import isConnection from '../../utils/isConnection';
import isManyLink from '../../utils/isManyLink';
import formatData from './formatData';
import makeSelectorError from '../makeSelectorError';

export default function getRelationData(type, id, name, state, constraints, shallow) {
  // log warning if relation does not exist
  if (!state.entities.data[type][id][name] || !isConnection(state.entities.data[type][id][name])) {
    throw makeSelectorError('MISSING_JOINED_RELATION', { type, id, name });
  }

  // relation is set to null
  if (state.entities.data[type][id][name].link === null) {
    return null;
  }

  const childrenTypeIds = state.entities.data[type][id][name].link;

  // only select shallow link entities
  if (shallow) {
    if (!isManyLink(childrenTypeIds)) {
      return formatData(childrenTypeIds[0], childrenTypeIds[1], state.entities.data, true);
    }

    return childrenTypeIds
      .map(childrenId => formatData(childrenId[0], childrenId[1], state.entities.data, true))
      .filter(item => item !== undefined);
  }

  // select full entity
  const selector = constraints
    ? constraints(new Selector(state, childrenTypeIds))
    : new Selector(state, childrenTypeIds);

  return selector.getData();
}
