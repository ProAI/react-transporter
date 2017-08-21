const initialState = {};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'TRANSPORTER_REQUESTS_START': {
      return {
        ...state,
        [action.name]: {
          loading: true,
          error: null,
        },
      };
    }
    case 'TRANSPORTER_REQUESTS_COMPLETED': {
      return {
        ...state,
        [action.name]: {
          loading: false,
          error: null,
        },
      };
    }
    case 'TRANSPORTER_REQUESTS_ERROR': {
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
}
