import { combineReducers } from 'redux';
import createEntitiesReducer from './createEntitiesReducer';
import createAliasesReducer from './createAliasesReducer';
import createRequestsReducer from './createRequestsReducer';

export default function createReducer(aliases, entities) {
  return combineReducers({
    aliases: createAliasesReducer(aliases),
    entities: createEntitiesReducer(entities),
    requests: createRequestsReducer(),
  });
}
