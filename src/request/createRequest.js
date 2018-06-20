import generateId from '../utils/generateId';
import WriteStore from './WriteStore';

const TRANSPORTER_STATE = 'transporter';

function makeData(updater, getState, response) {
  if (!updater) {
    return response;
  }

  const state = getState();

  const store = new WriteStore(state[TRANSPORTER_STATE], response);
  updater(store, response); // TODO only pass in root and trashed ids of response
  return store.data;
}

export default function createRequest(request, fetch) {
  return (dispatch, getState) => {
    // create request id if not present
    if (!request.id) request.id = generateId();
    const startTime = new Date();
    const data =
      request.type === 'TRANSPORTER_MUTATION' ? makeData(request.optimisticUpdater, getState) : {};
    const optimisticData = request.type === 'TRANSPORTER_MUTATION' ? data : null;

    dispatch({
      type: 'TRANSPORTER_REQUEST_START',
      id: request.id,
      startTime,
      optimisticData,
    });

    // dispatch query
    return fetch(request.schema, request.variables).then(
      () => {
        try {
          dispatch({
            type: 'TRANSPORTER_REQUEST_COMPLETED',
            id: request.id,
            endTime: new Date(),
            optimisticData,
            data,
          });
        } catch (error) {
          dispatch({
            type: 'TRANSPORTER_REQUEST_ERROR',
            id: request.id,
            endTime: new Date(),
            optimisticData,
            error: 'Internal error',
          });

          throw error;
        }
      },
      (error) => {
        // update request status on error
        dispatch({
          type: 'TRANSPORTER_REQUEST_ERROR',
          id: request.id,
          endTime: new Date(),
          optimisticData,
          error,
        });
      },
    );
  };
}
