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

    try {
      dispatch({
        type: 'TRANSPORTER_REQUEST_START',
        id: request.id,
        startTime,
        optimisticData:
          request.type === 'TRANSPORTER_MUTATION'
            ? makeData(request.optimisticUpdater, getState)
            : null,
      });
    } catch (error) {
      // console log error message if error is RequestError
      if (error.constructor.name === 'RequestError') {
        // eslint-disable-next-line no-console
        console.error(error.getMessage());
        return;
      }

      throw error;
    }

    // immediately stop request on server for now
    // TODO
    if (typeof window === 'undefined') {
      dispatch({
        type: 'TRANSPORTER_REQUEST_COMPLETED',
        id: request.id,
        startTime,
        endTime: new Date(),
        data:
          request.type === 'TRANSPORTER_MUTATION'
            ? makeData(request.optimisticUpdater, getState)
            : null,
      });
    }

    // pseudo fetch data on client for now
    // TODO
    if (typeof window !== 'undefined') {
      // dispatch query
      fetch(request.schema, request.variables).then(
        (response) => {
          try {
            dispatch({
              type: 'TRANSPORTER_REQUEST_COMPLETED',
              id: request.id,
              startTime,
              endTime: new Date(),
              data: makeData(request.updater, getState, response),
            });
          } catch (error) {
            dispatch({
              type: 'TRANSPORTER_REQUEST_ERROR',
              id: request.id,
              startTime,
              endTime: new Date(),
              error,
            });

            // console log error message if error is RequestError
            if (error.constructor.name === 'RequestError') {
              // eslint-disable-next-line no-console
              console.error(error.getMessage());
              return;
            }

            throw error;
          }
        },
        (error) => {
          // update request status on error
          dispatch({
            type: 'TRANSPORTER_REQUEST_ERROR',
            id: request.id,
            startTime,
            endTime: new Date(),
            error,
          });
        },
      );
    }
  };
}
