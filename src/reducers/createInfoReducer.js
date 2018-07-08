export default function createInfoReducer() {
  const initialState = {
    lastReset: null,
  };

  return function reducer(state = initialState, action) {
    if (action.type === 'TRANSPORTER_STORE_RESET') {
      return {
        lastReset: action.lastReset,
      };
    }

    return state;
  };
}
