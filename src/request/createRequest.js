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

    const queryBody =
      request.type === 'TRANSPORTER_MUTATION'
        ? request.mutation.loc.source.body
        : request.query.loc.source.body;

    const throwError = (error, rollback = false) => {
      dispatch({
        type: 'TRANSPORTER_REQUEST_ERROR',
        id: request.id,
        endTime: getTimestamp(),
        optimisticData: rollback ? optimisticData : {},
        error,
      });

      throw new Error(error);
    };

    // dispatch query
    return fetch(queryBody, request.variables).then(
      result =>
        result.json().then(responseData => {
          const state = getState();

          // Only apply response if store was not reset in the meantime
          if (state[TRANSPORTER_STATE].info.lastReset >= startTime) {
            // We don't need to rollback optimisticData here
            throwError('Store reset after request was started.', true);
          }

          // Response has errors
          if (responseData.errors && responseData.errors.length > 0) {
            // Log and throw GraphQL error(s)
            throwError(responseData.errors);
          }

          // Response is okay
          try {
            const data = makeData(request.updater, getState, responseData.data);

            // Try to add response to store
            dispatch({
              type: 'TRANSPORTER_REQUEST_COMPLETED',
              id: request.id,
              endTime: getTimestamp(),
              optimisticData,
              data,
            });
          } catch (error) {
            // Log and throw internal error
            throwError('Internal error');
          }

          return responseData;
        }),
      error => {
        // Something else went wrong
        throwError(error);
      },
    );
  };
}
