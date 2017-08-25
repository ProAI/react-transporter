import { slice, push } from '../utils';

const initialState = {};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'TRANSPORTER_ALIASES_CREATE': {
      return {
        ...state,
        [action.name]: action.ids,
      };
    }
    case 'TRANSPORTER_ALIASES_PUSH': {
      return {
        ...state,
        [action.name]: push(state[action.name], action.ids),
      };
    }
    case 'TRANSPORTER_ALIASES_SLICE': {
      return {
        ...state,
        [action.name]: slice(state[action.name], action.ids),
      };
    }
    case 'TRANSPORTER_ALIASES_DELETE': {
      const newState = { ...state };

      delete newState[action.name];

      return newState;
    }
    default: {
      return state;
    }
  }
}
