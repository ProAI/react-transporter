import generateId from '../utils/generateId';
import WriteStore from './WriteStore';

const TRANSPORTER_STATE = 'transporter';

const getTimestamp = () => new Date().getTime();

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
    const startTime = getTimestamp();
    const storeData =
      request.type === 'TRANSPORTER_MUTATION' ? makeData(request.optimisticUpdater, getState) : {};
    const optimisticData = request.type === 'TRANSPORTER_MUTATION' ? storeData : null;

    dispatch({
      type: 'TRANSPORTER_REQUEST_START',
      id: request.id,
      startTime,
      optimisticData,
    });

    // dispatch query
    return fetch(request.schema, request.variables).then(
      result =>
        result.json().then((responseData) => {
          const state = getState();

          // Only apply response if store was not reset in the meantime
          if (state[TRANSPORTER_STATE].info.lastReset >= startTime) {
            dispatch({
              type: 'TRANSPORTER_REQUEST_ERROR',
              id: request.id,
              endTime: new Date().getTime(),
              // We don't need to rollback optimisticData here
              optimisticData: {},
              error: 'Store reset after request was started.',
            });

            throw new Error();
          }

          // Response has errors
          if (responseData.errors && responseData.errors.length > 0) {
            // Log and throw GraphQL error(s)
            dispatch({
              type: 'TRANSPORTER_REQUEST_ERROR',
              id: request.id,
              endTime: getTimestamp(),
              optimisticData,
              error: responseData.errors,
            });

            throw responseData.errors;
          }

          // Response is okay
          try {
            // Try to add response to store
            dispatch({
              type: 'TRANSPORTER_REQUEST_COMPLETED',
              id: request.id,
              endTime: getTimestamp(),
              optimisticData,
              data: responseData.data,
            });
          } catch (error) {
            // Log and throw internal error
            dispatch({
              type: 'TRANSPORTER_REQUEST_ERROR',
              id: request.id,
              endTime: getTimestamp(),
              optimisticData,
              error: 'Internal error',
            });

            throw error;
          }

          return responseData;
        }),
      (error) => {
        // Something else went wrong
        dispatch({
          type: 'TRANSPORTER_REQUEST_ERROR',
          id: request.id,
          endTime: getTimestamp(),
          optimisticData,
          error,
        });

        throw error;
      },
    );
  };
}
