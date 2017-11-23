import { combineReducers } from 'redux';
import createEntitiesReducer from './createEntitiesReducer';
import createRootsReducer from './createRootsReducer';
import createRequestsReducer from './createRequestsReducer';

export default function createReducer(roots, entities) {
  return combineReducers({
    roots: createRootsReducer(roots),
    entities: createEntitiesReducer(entities),
    requests: createRequestsReducer(),
  });
}
