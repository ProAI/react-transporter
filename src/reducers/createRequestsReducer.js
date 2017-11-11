export default function createReducer() {
  const initialState = {};

  return function reducer(state = initialState, action) {
    switch (action.type) {
      case 'TRANSPORTER_REQUEST_START': {
        return {
          ...state,
          [action.name]: {
            loading: true,
            error: null,
          },
        };
      }
      case 'TRANSPORTER_REQUEST_COMPLETED': {
        return {
          ...state,
          [action.name]: {
            loading: false,
            error: null,
          },
        };
      }
      case 'TRANSPORTER_REQUEST_ERROR': {
        return {
          ...state,
          [action.name]: {
            loading: false,
            error: action.error,
          },
        };
      }
      default: {
        return state;
      }
    }
  };
}
