import { slice, push } from '../../utils';

const initialState = {};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'TRANSPORTER_ENTITIES_UPDATE': {
      return {
        ...state,
        // TODO
      };
    }
    case 'TRANSPORTER_ENTITIES_DELETE': {
      return {
        ...state,
        // TODO
      };
    }
    case 'TRANSPORTER_ENTITIES_CONNECTION_PUSH': {
      const connection = action.connection;
      const entity = state[connection.id[0]][connection.id[1]];
      entity[connection.name].entities = push(entity[connection.name].entities, action.ids);
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
      entity[connection.name].entities = slice(entity[connection.name].entities, action.ids);
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
