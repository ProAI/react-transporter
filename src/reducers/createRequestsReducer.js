export default function createRequestsReducer() {
  const initialState = {};

  return function reducer(state = initialState, action) {
    switch (action.type) {
      case 'TRANSPORTER_REQUEST_START': {
        return {
          ...state,
          [action.id]: {
            startTime: action.startTime,
            loading: true,
            error: null,
          },
        };
      }
      case 'TRANSPORTER_REQUEST_COMPLETED': {
        return {
          ...state,
          [action.id]: {
            startTime: action.startTime,
            endTime: action.endTime,
            loading: false,
            error: null,
          },
        };
      }
      case 'TRANSPORTER_REQUEST_ERROR': {
        return {
          ...state,
          [action.id]: {
            startTime: action.startTime,
            endTime: action.endTime,
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
