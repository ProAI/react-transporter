import getPosition from '../utils/getPosition';

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
        error: null,
      });
    }

    // TRANSPORTER_REQUEST_COMPLETED
    if (action.type === 'TRANSPORTER_REQUEST_COMPLETED') {
      const position = getPosition(action.id, nextState);

      nextState[position] = {
        ...nextState[position],
        endTime: action.endTime,
        loading: false,
      };
    }

    // TRANSPORTER_REQUEST_ERROR
    if (action.type === 'TRANSPORTER_REQUEST_COMPLETED') {
      const position = getPosition(action.id, nextState);

      nextState[position] = {
        ...nextState[position],
        endTime: action.endTime,
        loading: false,
        error: action.error,
      };
    }

    return nextState;
  };
}
