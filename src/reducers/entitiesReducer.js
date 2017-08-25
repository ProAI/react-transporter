import { slice, push } from '../utils';

const initialState = {};

function mergeEntities(entity1, entity2) {
  const mergedEntity = { ...entity1 };

  Object.keys(entity2).forEach((key) => {
    if (entity1[key] && entity1[key].connection) {
      // merge existing connection
      mergedEntity[key] = {
        ...entity1[key],
        ...entity2[key],
        connection: push(entity1[key].connection, entity2[key].connection),
      };
    } else {
      // add attribute
      mergedEntity[key] = entity2[key];
    }
  });

  return mergedEntity;
}

export default function reducer(state = initialState, action) {
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
    case 'TRANSPORTER_ENTITIES_CONNECTION_PUSH': {
      const connection = action.connection;
      const entityState = state[connection.id[0]][connection.id[1]];

      return {
        ...state,
        [connection.id[0]]: {
          ...state[connection.id[0]],
          [connection.id[1]]: {
            ...entityState,
            [connection.name]: {
              ...entityState[connection.name],
              connection: push(entityState[connection.name].connection, action.ids),
            },
          },
        },
      };
    }
    case 'TRANSPORTER_ENTITIES_CONNECTION_SLICE': {
      const connection = action.connection;
      const entity = state[connection.id[0]][connection.id[1]];

      return {
        ...state,
        [connection.id[0]]: {
          ...state[connection.id[0]],
          [connection.id[1]]: {
            ...entity,
            [connection.name]: {
              ...entity[connection.name],
              connection: slice(entity[connection.name].connection, action.ids),
            },
          },
        },
      };
    }
    case 'TRANSPORTER_ENTITIES_CONNECTION_DELETE': {
      const connection = action.connection;
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
}
