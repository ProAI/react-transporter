import hasManyEntities from '../utils/hasManyEntities';
import prependEntities from './utils/prependEntities';
import appendEntities from './utils/appendEntities';
import detachEntities from './utils/detachEntities';
import mergeEntities from './utils/mergeEntities';

export default function createReducer(entities) {
  const initialState = entities;

  return function reducer(state = initialState, baseAction) {
    if (
      (baseAction.type === 'TRANSPORTER_REQUEST_START' ||
        baseAction.type === 'TRANSPORTER_REQUEST_COMPLETED') &&
      baseAction.actions
    ) {
      const nextState = { ...state };

      baseAction.actions.forEach((action) => {
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
              throw new Error(`Failed to insert entity: Entity [${type}, ${id}] already exists.`);
            }

            nextState[type][id] = {};
            break;
          }
          // update entity
          case 'UPDATE_ENTITY': {
            const { 0: type, 1: id } = action.entity;

            // error checks
            if (!nextState[type] || (nextState[type] && !nextState[type][id])) {
              throw new Error(`Failed to update entity: Entity [${type}, ${id}] does not exist.`);
            }

            nextState[type][id] = Object.assign({}, action.data, nextState[type][id]);
            break;
          }
          // delete entity
          case 'DELETE_ENTITY': {
            const { 0: type, 1: id } = action.entity;

            // error checks
            if (!nextState[type] || (nextState[type] && !nextState[type][id])) {
              throw new Error(`Failed to delete entity: Entity [${type}, ${id}] does not exist.`);
            }

            nextState[type][id] = undefined;
            break;
          }
          // update connection
          case 'UPDATE_CONNECTION': {
            const { entity: { 0: type, 1: id }, name, linkedEntity } = action;

            // error checks
            if (!nextState[type] || (nextState[type] && !nextState[type][id])) {
              throw new Error(`Failed to update entity connection: Entity [${type}, ${id}] of connection '${
                name
              }' does not exist.`);
            }
            if (
              nextState[type][id][name].linked &&
              hasManyEntities(nextState[type][id][name].linked)
            ) {
              throw new Error(`Failed to update connection: Connection '${name}' of entity [${id[0]}, ${
                id[1]
              }] is a many connection, use syncPrepend(), syncAppend(), prepend(), append() or detach().`);
            }

            nextState[type][id][name].linked = linkedEntity;
            break;
          }
          // update many connection
          case 'UPDATE_MANY_CONNECTION': {
            const { entity: { 0: type, 1: id }, name, linkedEntities } = action;

            // error checks
            if (!nextState[type] || (nextState[type] && !nextState[type][id])) {
              throw new Error(`Failed to update entity many connection: Entity [${type},${
                id
              }] of many connection '${name}' does not exist.`);
            }
            if (
              nextState[type][id][name].linked &&
              !hasManyEntities(nextState[type][id][name].linked)
            ) {
              throw new Error(`Failed to update connection: Connection '${name}' of entity [${id[0]}, ${
                id[1]
              }] is NOT a many connection, use link() or unlink().`);
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
