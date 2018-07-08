import getPosition from '../utils/getPosition';
import isAmongEntities from './utils/isAmongEntities';
import addOptimisticUpdate from './utils/addOptimisticUpdate';
import revertOptimisticUpdate from './utils/revertOptimisticUpdate';
import updateValueBeforeRevertingOptimisticUpdate from './utils/updateValueBeforeRevertingOptimisticUpdate';

export default function createEntitiesReducer(data) {
  const initialState = {
    data,
    optimistic: {
      updates: {},
      deletions: {},
    },
  };

  return function reducer(state = initialState, baseAction) {
    const nextState = { ...state };
    const action = { ...baseAction };

    // TRANSPORTER_REQUEST_START
    // apply optimistic data
    if (action.type === 'TRANSPORTER_REQUEST_START' && action.optimisticData) {
      // insertions/updates
      if (action.optimisticData.entities) {
        Object.keys(action.optimisticData.entities).forEach((type) => {
          // prerequisites / create (optimistic) type of entities if not present
          if (!nextState.data[type]) nextState.data[type] = {};
          if (!nextState.optimistic.updates[type]) nextState.optimistic.updates[type] = {};

          Object.keys(action.optimisticData.entities[type]).forEach((id) => {
            // prerequisites / create optimistic entity if not present
            if (!nextState.optimistic.updates[type][id]) {
              nextState.optimistic.updates[type][id] = {};
            }

            // add optimistic values
            Object.keys(action.optimisticData.entities[type][id]).forEach((field) => {
              const getField = (object) => {
                if (!object[type] || !object[type][id]) return undefined;
                return object[type][id][field];
              };

              // add optimistic update value
              nextState.optimistic.updates[type][id][field] = addOptimisticUpdate(
                nextState,
                action,
                getField,
              );
            });

            // temporarily set stored value to optimistic value
            nextState.data[type][id] = Object.assign(
              {},
              nextState.data[type][id],
              action.optimisticData.entities[type][id],
            );
          });
        });
      }

      // deletions
      if (action.optimisticData.trash) {
        action.optimisticData.trash.forEach(([type, id]) => {
          if (nextState.data[type] && nextState.data[type][id]) {
            // prerequisites / create optimistic type of entities if not present
            if (!nextState.optimistic.deletions[type]) nextState.optimistic.deletions[type] = {};

            // add trashed entity to optimistically trashed entities
            nextState.optimistic.deletions[type][id] = {
              id: action.id,
              value: nextState.data[type][id],
            };

            // temporarily delete entity
            delete nextState.data[type][id];
          }
        });
      }
    }

    // TRANSPORTER_REQUEST_COMPLETED || TRANSPORTER_REQUEST_ERROR
    // revert optimistic data & apply response data for specified fields
    if (
      (action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
        action.type === 'TRANSPORTER_REQUEST_ERROR') &&
      action.optimisticData
    ) {
      // insertions/updates
      if (action.optimisticData.entities) {
        Object.keys(action.optimisticData.entities).forEach((type) => {
          Object.keys(action.optimisticData.entities[type]).forEach((id) => {
            Object.keys(action.optimisticData.entities[type][id]).forEach((field) => {
              const getField = (object) => {
                if (!object[type] || !object[type][id]) return undefined;
                return object[type][id][field];
              };

              // get position of optimistic value & throw error if optimistic value was not found
              const position = getPosition(
                action.id,
                getField(nextState.optimistic.updates).values,
              );
              if (position === -1) {
                throw new Error('Optimistic value not found.');
              }

              // update stored value
              updateValueBeforeRevertingOptimisticUpdate(position, state, action, getField);

              // revert optimistic value
              nextState.optimistic.updates[type][id][field] = revertOptimisticUpdate(
                position,
                state,
                action,
                getField,
              );
              if (nextState.optimistic.updates[type][id][field] === undefined) {
                delete nextState.optimistic.updates[type][id][field];
              }

              // delete value from response if present
              if (action.data && action.data.entities && getField(action.data.entities)) {
                delete action.data.entities[type][id][field];
              }
            });

            // garbage collection
            if (Object.keys(nextState.optimistic.updates[type][id]).length === 0) {
              delete nextState.optimistic.updates[type][id];
            }
          });

          // garbage collection
          if (Object.keys(nextState.optimistic.updates[type]).length === 0) {
            delete nextState.optimistic.updates[type];
          }
        });
      }

      // deletions
      if (action.optimisticData.trash) {
        action.optimisticData.trash.forEach(([type, id]) => {
          // check if request id is correct
          if (nextState.optimistic.deletions[type][id].id !== action.id) {
            throw new Error('Optimistic deletion was processed by other request.');
          }

          // check if optimistic deletion is in response too
          const position =
            action.data && action.data.trash ? isAmongEntities([type, id], action.data.trash) : -1;
          if (position !== -1) {
            // if yes -> delete entity from response
            delete action.data.trash[position];
          } else {
            // if no -> restore entity
            // prerequisites / create type of entities if not present
            if (!nextState.data[type]) nextState.data[type] = {};

            // set entity
            nextState.data[type][id] = nextState.optimistic.deletions[type][id].value;
          }

          // finally delete entity from optimistic data
          delete nextState.optimistic.deletions[type][id];
          if (Object.keys(nextState.optimistic.deletions[type]).length === 0) {
            delete nextState.optimistic.deletions[type];
          }
        });
      }
    }

    // TRANSPORTER_REQUEST_COMPLETED
    // apply response data
    if (action.type === 'TRANSPORTER_REQUEST_COMPLETED') {
      // insertions/updates
      if (action.data.entities) {
        Object.keys(action.data.entities).forEach((type) => {
          // prerequisites / create type of entities if not present
          if (!nextState.data[type]) nextState.data[type] = {};

          Object.keys(action.data.entities[type]).forEach((id) => {
            // add entity to store
            nextState.data[type][id] = Object.assign(
              {},
              nextState.data[type][id],
              action.data.entities[type][id],
            );
          });
        });
      }

      // deletions
      if (action.data.trash) {
        action.data.trash.forEach(([type, id]) => {
          // delete entity from store
          if (nextState.data[type] && nextState.data[type][id]) {
            delete nextState.data[type][id];
          }
        });
      }
    }

    if (action.type === 'TRANSPORTER_STORE_RESET') {
      return {
        data: {},
        optimistic: {
          updates: {},
          deletions: {},
        },
      };
    }

    return nextState;
  };
}
