import { connectionSlice, connectionPush, hasMany } from '../utils';

function mergeEntities(entity1, entity2) {
  const mergedEntity = { ...entity1 };

  Object.keys(entity2).forEach((key) => {
    if (entity1[key] && entity1[key].connection) {
      // merge existing connection
      mergedEntity[key] = {
        ...entity1[key],
        ...entity2[key],
        connection: connectionPush(entity1[key].connection, entity2[key].connection),
      };
    } else {
      // add attribute
      mergedEntity[key] = entity2[key];
    }
  });

  return mergedEntity;
}

export default function createReducer(entities) {
  const initialState = entities;

  return function reducer(state = initialState, action) {
    switch (action.type) {
      case 'TRANSPORTER_ENTITIES_UPDATE': {
        // merge entities
        const newState = { ...state };
        Object.keys(action.entities).forEach((type) => {
          if (!newState[type]) {
            newState[type] = {};
          }
          Object.keys(action.entities[type]).forEach((key) => {
            if (!newState[type][key]) {
              // insert new entity
              newState[type][key] = action.entities[type][key];
            } else {
              // update entity
              newState[type][key] = mergeEntities(state[type][key], action.entities[type][key]);
            }
          });
        });

        return newState;
      }
      case 'TRANSPORTER_ENTITIES_DELETE': {
        const newState = { ...state };

        action.ids.forEach((id) => {
          delete newState[id[0]][id[1]];
        });

        return newState;
      }
      case 'TRANSPORTER_ENTITIES_CONNECTION_UPDATE': {
        const { connection } = action;
        const entityState = state[connection.id[0]][connection.id[1]];

        if (hasMany(entityState[connection.name].connection)) {
          throw new Error(`Connection '${connection.name}' of entity [${connection.id[0]}, ${connection
            .id[1]}] is a many connection, use push() or slice().`);
        }

        return {
          ...state,
          [connection.id[0]]: {
            ...state[connection.id[0]],
            [connection.id[1]]: {
              ...entityState,
              [connection.name]: {
                ...entityState[connection.name],
                connection: action.id,
              },
            },
          },
        };
      }
      case 'TRANSPORTER_ENTITIES_CONNECTION_PUSH': {
        const { connection } = action;
        const entityState = state[connection.id[0]][connection.id[1]];

        if (!hasMany(entityState[connection.name].connection)) {
          throw new Error(`Connection '${connection.name}' of entity [${connection.id[0]}, ${connection
            .id[1]}] is NOT a many connection, use update().`);
        }

        return {
          ...state,
          [connection.id[0]]: {
            ...state[connection.id[0]],
            [connection.id[1]]: {
              ...entityState,
              [connection.name]: {
                ...entityState[connection.name],
                connection: connectionPush(entityState[connection.name].connection, action.ids),
              },
            },
          },
        };
      }
      case 'TRANSPORTER_ENTITIES_CONNECTION_SLICE': {
        const { connection } = action;
        const entityState = state[connection.id[0]][connection.id[1]];

        if (!hasMany(entityState[connection.name].connection)) {
          throw new Error(`Connection '${connection.name}' of entity [${connection.id[0]}, ${connection
            .id[1]}] is NOT a many connection, use update().`);
        }

        return {
          ...state,
          [connection.id[0]]: {
            ...state[connection.id[0]],
            [connection.id[1]]: {
              ...entityState,
              [connection.name]: {
                ...entityState[connection.name],
                connection: connectionSlice(entityState[connection.name].connection, action.ids),
              },
            },
          },
        };
      }
      case 'TRANSPORTER_ENTITIES_CONNECTION_DELETE': {
        const { connection } = action;
        const newEntityState = { ...state[connection.id[0]][connection.id[1]] };

        delete newEntityState[connection.name];

        return {
          ...state,
          [connection.id[0]]: {
            ...state[connection.id[0]],
            [connection.id[1]]: newEntityState,
          },
        };
      }
      default: {
        return state;
      }
    }
  };
}
