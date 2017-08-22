import { slice, push } from '../utils';

const initialState = {};

function mergeEntities(entity1, entity2) {
  const mergedEntity = entity1;
  Object.keys(entity2).forEach((key) => {
    if (entity1[key] && entity1[key].connection) {
      // merge existing connection
      mergedEntity[key] = {
        ...entity1[key],
        ...entity2[key],
        connection: push(entity1[key].connection, entity2[key].connection),
      };
    } else {
      // add new attribute
      mergedEntity[key] = entity2[key];
    }
  });
}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'TRANSPORTER_ENTITIES_UPDATE': {
      const entities = state;
      Object.keys(action.entities).forEach((type) => {
        Object.keys(action.entities[type]).forEach((key) => {
          if (!entities[type][key]) {
            // insert new entity
            entities[type][key] = action.entities[type][key];
          } else {
            // update entity
            entities[type][key] = mergeEntities(entities[type][key], action.entities[type][key]);
          }
        });
      });
      return entities;
    }
    case 'TRANSPORTER_ENTITIES_DELETE': {
      const entities = state;
      action.ids.forEach((id) => {
        delete entities[id[0]][id[1]];
      });
      return entities;
    }
    case 'TRANSPORTER_ENTITIES_CONNECTION_PUSH': {
      const connection = action.connection;
      const entity = state[connection.id[0]][connection.id[1]];
      entity[connection.name].connection = push(entity[connection.name].connection, action.ids);
      return {
        ...state,
        [connection.id[0]]: {
          ...state[connection.id[0]],
          [connection.id[1]]: entity,
        },
      };
    }
    case 'TRANSPORTER_ENTITIES_CONNECTION_SLICE': {
      const connection = action.connection;
      const entity = state[connection.id[0]][connection.id[1]];
      entity[connection.name].connection = slice(entity[connection.name].connection, action.ids);
      return {
        ...state,
        [connection.id[0]]: {
          ...state[connection.id[0]],
          [connection.id[1]]: entity,
        },
      };
    }
    case 'TRANSPORTER_ENTITIES_CONNECTION_DELETE': {
      const connection = action.connection;
      const entity = state[connection.id[0]][connection.id[1]];
      delete entity[connection.name];
      return {
        ...state,
        [connection.id[0]]: {
          ...state[connection.id[0]],
          [connection.id[1]]: entity,
        },
      };
    }
    default: {
      return state;
    }
  }
}
