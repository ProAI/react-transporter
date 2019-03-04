import generateId from '../utils/generateId';
import WriteStore from './WriteStore';
import ErrorHandler from './ErrorHandler';

const TRANSPORTER_STATE = 'transporter';

const STORE_RESET_ERROR = 'Store reset after request was started.';

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

  try {
    updater(store, data);
  } catch (error) {
    if (error.name === 'StoreError') {
      // eslint-disable-next-line no-console
      console.error(error.message);
    }

    throw error;
  }

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

    let optimisticData = null;
    if (isMutation) {
      try {
        optimisticData = makeData(request.type, request.optimisticUpdater, getState());
      } catch (error) {
        if (error.name === 'StoreError') {
          return Promise.reject(error);
        }

        throw error;
      }
    }

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

      return Promise.reject(errors);
    };

    // dispatch query
    return fetch(requestBody, request.variables).then(
      result => {
        if (!result.ok) {
          handleErrors({ network: result.statusText });
        }

        return result.json().then(responseData => {
          const state = getState();

          // In the meantime the store was resetted, so do not apply response.
          if (state[TRANSPORTER_STATE].info.lastReset >= startTime) {
            return handleErrors({ internal: `Internal error: ${STORE_RESET_ERROR}` }, null, false);
          }

          // Response has errors, so log them.
          if (responseData.errors) {
            return handleErrors({ graphql: responseData.errors }, responseData.data);
          }

          // Response is okay.
          let data = null;
          if (responseData.data) {
            try {
              data = makeData(request.type, request.updater, state, responseData.data);
            } catch (error) {
              if (error.name === 'StoreError') {
                return handleErrors({ internal: error.message }, responseData.data);
              }

              throw error;
            }
          }

          dispatch({
            type: 'TRANSPORTER_REQUEST_COMPLETED',
            id: requestId,
            endTime: getTimestamp(),
            optimisticData,
            data,
          });

          return responseData.data;
        });
      },
      error => {
        // Something else went wrong
        return handleErrors({ network: `Network error: ${error.message}` });
      },
    );
  };
}
