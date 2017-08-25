import { connectionSlice, connectionPush, hasMany } from '../utils';

const initialState = {};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'TRANSPORTER_ALIAS_CREATE': {
      return {
        ...state,
        [action.name]: action.idOrIds,
      };
    }
    case 'TRANSPORTER_ALIAS_UPDATE': {
      if (hasMany(state[action.name])) {
        throw new Error(`Alias '${action.name.name}' is a many alias, use push() or slice().`);
      }

      return {
        ...state,
        [action.name]: action.id,
      };
    }
    case 'TRANSPORTER_ALIAS_PUSH': {
      if (!hasMany(state[action.name])) {
        throw new Error(`Alias '${action.name}' is NOT a many alias, use update().`);
      }

      return {
        ...state,
        [action.name]: connectionPush(state[action.name], action.ids),
      };
    }
    case 'TRANSPORTER_ALIAS_SLICE': {
      if (!hasMany(state[action.name])) {
        throw new Error(`Alias '${action.name}' is NOT a many alias, use update().`);
      }

      return {
        ...state,
        [action.name]: connectionSlice(state[action.name], action.ids),
      };
    }
    case 'TRANSPORTER_ALIAS_DELETE': {
      const newState = { ...state };

      delete newState[action.name];

      return newState;
    }
    default: {
      return state;
    }
  }
}
