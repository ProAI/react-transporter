export default function createRequestsReducer() {
  const initialState = [];

  return function reducer(state = initialState, action) {
    const nextState = [...state];

    // TRANSPORTER_REQUEST_START
    if (action.type === 'TRANSPORTER_REQUEST_START') {
      nextState.push({
        id: action.id,
        startTime: action.startTime,
        endTime: null,
        loading: true,
        errors: null,
      });
    }

    // TRANSPORTER_REQUEST_COMPLETED
    if (action.type === 'TRANSPORTER_REQUEST_COMPLETED') {
      const position = nextState.findIndex(request => request.id === action.id);

      nextState[position] = {
        ...nextState[position],
        endTime: action.endTime,
        loading: false,
      };
    }

    // TRANSPORTER_REQUEST_ERROR
    if (action.type === 'TRANSPORTER_REQUEST_COMPLETED') {
      const position = nextState.findIndex(request => request.id === action.id);

      nextState[position] = {
        ...nextState[position],
        endTime: action.endTime,
        loading: false,
        errors: action.errors,
      };
    }

    return nextState;
  };
}
