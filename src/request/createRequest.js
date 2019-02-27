import generateId from '../utils/generateId';
import WriteStore from './WriteStore';
import ErrorHandler from './ErrorHandler';

const TRANSPORTER_STATE = 'transporter';

const getTimestamp = () => new Date().getTime();

function getStoreData(type, data) {
  const storeData = { ...data };

  // If mutation, we don't want to store the roots.
  if (type === 'TRANSPORTER_MUTATION') {
    delete storeData.roots;
  }

  return storeData;
}

function makeData(type, updater, state, data) {
  const storeData = data ? getStoreData(type, data) : null;

  if (!updater) {
    return storeData;
  }

  const store = new WriteStore(state[TRANSPORTER_STATE], storeData);
  updater(store, data);

  return store.toObject();
}

export default function createRequest(request, fetch) {
  return (dispatch, getState) => {
    const startTime = getTimestamp();
    const isMutation = request.type === 'TRANSPORTER_MUTATION';

    const requestId = request.id || generateId();
    const requestBody = isMutation
      ? request.mutation.loc.source.body
      : request.query.loc.source.body;

    const optimisticData = isMutation
      ? makeData(request.type, request.optimisticUpdater, getState())
      : null;

    dispatch({
      type: 'TRANSPORTER_REQUEST_START',
      id: requestId,
      startTime,
      optimisticData,
    });

    const handleErrors = (errors, data, rollback = true) => {
      dispatch({
        type: 'TRANSPORTER_REQUEST_ERROR',
        id: requestId,
        endTime: getTimestamp(),
        optimisticData: rollback ? optimisticData : null,
        data,
        errors,
      });

      ErrorHandler.handle(errors);

      throw new Error(errors);
    };

    // dispatch query
    return fetch(requestBody, request.variables).then(
      result =>
        result.json().then(responseData => {
          const state = getState();

          // In the meantime the store was resetted, so do not apply response.
          if (state[TRANSPORTER_STATE].info.lastReset >= startTime) {
            handleErrors({ internal: 'Store reset after request was started.' }, null, false);
          }

          // Response has errors, so log them.
          if (responseData.errors) {
            handleErrors({ graphql: responseData.errors }, responseData.data);
          }

          // Response is okay.
          const data = responseData.data
            ? makeData(request.type, request.updater, state, responseData.data)
            : null;

          dispatch({
            type: 'TRANSPORTER_REQUEST_COMPLETED',
            id: requestId,
            endTime: getTimestamp(),
            optimisticData,
            data,
          });

          return responseData;
        }),
      () => {
        // Something else went wrong
        handleErrors({ network: 'Network error' }, null);
      },
    );
  };
}
