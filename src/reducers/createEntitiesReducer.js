import hasManyEntities from '../utils/hasManyEntities';
import prependEntities from './utils/prependEntities';
import appendEntities from './utils/appendEntities';
import detachEntities from './utils/detachEntities';
import mergeEntities from './utils/mergeEntities';
import {
  throwInsertEntityError,
  throwUpdateEntityError,
  throwDeleteEntityError,
  throwUpdateConnectionError,
  throwWrongConnectionFormatError,
  throwWrongManyConnectionFormatError,
} from './utils/handleErrors';

export default function createReducer(entities) {
  const initialState = entities;

  return function reducer(state = initialState, baseAction) {
    if (
      (baseAction.type === 'TRANSPORTER_REQUEST_START' ||
        baseAction.type === 'TRANSPORTER_REQUEST_COMPLETED') &&
      baseAction.actions.entities &&
      baseAction.actions.entities.length > 0
    ) {
      const nextState = { ...state };

      baseAction.actions.entities.forEach((action) => {
        switch (action.type) {
          // apply response
          case 'APPLY_RESPONSE': {
            // merge entities
            Object.keys(action.entities).forEach((type) => {
              if (!nextState[type]) {
                nextState[type] = {};
              }
              Object.keys(action.entities[type]).forEach((id) => {
                if (!nextState[type][id]) {
                  // insert new entity
                  nextState[type][id] = action.entities[type][id];
                } else {
                  // update entity
                  nextState[type][id] = mergeEntities(state[type][id], action.entities[type][id]);
                }
              });
            });
            break;
          }
          // insert entity
          case 'INSERT_ENTITY': {
            const { 0: type, 1: id } = action.entity;

            // error checks
            if (nextState[type] && nextState[type][id]) {
              throwInsertEntityError(type, id);
            }

            nextState[type][id] = {};
            break;
          }
          // update entity
          case 'UPDATE_ENTITY': {
            const { 0: type, 1: id } = action.entity;

            // error checks
            if (!nextState[type] || (nextState[type] && !nextState[type][id])) {
              throwUpdateEntityError(type, id);
            }

            nextState[type][id] = Object.assign({}, nextState[type][id], action.data);
            break;
          }
          // delete entity
          case 'DELETE_ENTITY': {
            const { 0: type, 1: id } = action.entity;

            // error checks
            if (!nextState[type] || (nextState[type] && !nextState[type][id])) {
              throwDeleteEntityError(type, id);
            }

            nextState[type][id] = undefined;
            break;
          }
          // update connection
          case 'UPDATE_CONNECTION': {
            const { entity: { 0: type, 1: id }, name, linkedEntity } = action;

            // error checks
            if (!nextState[type] || (nextState[type] && !nextState[type][id])) {
              throwUpdateConnectionError(type, id, name);
            }
            if (
              nextState[type][id][name] &&
              nextState[type][id][name].linked &&
              hasManyEntities(nextState[type][id][name].linked)
            ) {
              throwWrongConnectionFormatError(type, id, name);
            }

            // create relation if relation does not exist
            if (!nextState[type][id][name]) {
              nextState[type][id][name] = {};
            }

            nextState[type][id][name].linked = linkedEntity;
            break;
          }
          // update many connection
          case 'UPDATE_MANY_CONNECTION': {
            const { entity: { 0: type, 1: id }, name, linkedEntities } = action;

            // error checks
            if (!nextState[type] || (nextState[type] && !nextState[type][id])) {
              throwUpdateConnectionError(type, id, name);
            }
            if (
              nextState[type][id][name] &&
              nextState[type][id][name].linked &&
              !hasManyEntities(nextState[type][id][name].linked)
            ) {
              throwWrongManyConnectionFormatError(type, id, name);
            }

            // create relation if relation does not exist
            if (!nextState[type][id][name]) {
              nextState[type][id][name] = {};
            }

            switch (action.method) {
              case 'sync_prepend': {
                nextState[type][id][name].linked = prependEntities(
                  linkedEntities,
                  nextState[type][id][name].linked,
                  true,
                );
                break;
              }
              case 'sync_append': {
                nextState[type][id][name].linked = appendEntities(
                  linkedEntities,
                  nextState[type][id][name].linked,
                  true,
                );
                break;
              }
              case 'prepend': {
                nextState[type][id][name].linked = prependEntities(
                  linkedEntities,
                  nextState[type][id][name].linked,
                );
                break;
              }
              case 'append': {
                nextState[type][id][name].linked = appendEntities(
                  linkedEntities,
                  nextState[type][id][name].linked,
                );
                break;
              }
              case 'detach': {
                nextState[type][id][name].linked = detachEntities(
                  linkedEntities,
                  nextState[type][id][name].linked,
                );
                break;
              }
              default: {
                // do nothing
              }
            }
            break;
          }
          default: {
            // do nothing
          }
        }
      });

      return nextState;
    }

    return state;
  };
}
