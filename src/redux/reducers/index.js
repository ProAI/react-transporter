import { combineReducers } from 'redux';
import entities from './entitiesReducer';
import aliases from './aliasesReducer';
import requests from './requestsReducer';

export default combineReducers({
  entities,
  aliases,
  requests,
});
