import WriteStore from './WriteStore';
import ErrorHandler from './ErrorHandler';
import generateId from '../utils/generateId';
import getTimestamp from '../utils/getTimestamp';
import TransporterError from '../errors/TransporterError';
import StoreError from '../errors/StoreError';

const TRANSPORTER_STATE = 'transporter';

export default function createRequest(request, fetch) {
  const startTime = getTimestamp();
  const isMutation = request.type === 'TRANSPORTER_MUTATION';

  const requestId = request.id || generateId();
  const requestBody = isMutation ? request.mutation.loc.source.body : request.query.loc.source.body;

  function getStoreData(updater, state, data) {
    const storeData = data ? { ...data } : null;

    // Don't apply roots for mutations.
    if (storeData && isMutation) {
      delete storeData.roots;
    }

    if (!updater) {
      return storeData;
    }

    const store = new WriteStore(state[TRANSPORTER_STATE], storeData);

    updater(store, data);

    return store.toSource();
  }

  return (dispatch, getState) => {
    function handleError(error, data, optimisticData) {
      dispatch({
        type: 'TRANSPORTER_REQUEST_ERROR',
        id: requestId,
        endTime: getTimestamp(),
        optimisticData,
        data,
        error: {
          type: error.type,
          message: error.message,
          data: error.data,
        },
      });

      ErrorHandler.handle(error);

      return Promise.reject(error);
    }

    // Create optimisticData if request is of type mutation.
    let optimisticData = null;
    if (isMutation) {
      try {
        optimisticData = getStoreData(request.optimisticUpdater, getState());
      } catch (error) {
        // Error #1: Something went wrong while applying optimistic updater.
        if (error.name === 'StoreError') {
          const transporterError = new TransporterError(
            'StoreError',
            'Request failed (StoreError)',
            {
              error: error.message,
            },
          );

          ErrorHandler.handle(transporterError);

          return Promise.reject(transporterError);
        }

        throw error;
      }
    }

    // Start request.
    dispatch({
      type: 'TRANSPORTER_REQUEST_START',
      id: requestId,
      startTime,
      optimisticData,
    });

    return fetch(requestBody, request.variables).then(
      result => {
        return result.json().then(response => {
          // Error #2: Http error code detected, throw error.
          if (!result.ok) {
            return handleError(
              new TransporterError(
                'HttpError',
                `Request failed (HttpError - ${result.status})`,
                response,
              ),
              null,
              optimisticData,
            );
          }

          const state = getState();

          // Error #3: In the meantime the store was resetted, so do not apply response.
          if (state[TRANSPORTER_STATE].info.lastReset >= startTime) {
            const error = new StoreError('Store reset after request was started.');

            return handleError(
              new TransporterError('StoreError', 'Request failed (StoreError)', {
                error: error.message,
              }),
              null,
              null,
            );
          }

          // Error #4: Response has GraphQL errors, throw error.
          if (response.errors) {
            return handleError(
              new TransporterError('GraphQLError', 'Request failed (GraphQLError)', {
                errors: response.errors,
              }),
              response.data,
              optimisticData,
            );
          }

          // Response is okay.
          let data = null;
          if (response.data) {
            try {
              data = getStoreData(request.updater, state, response.data);
            } catch (error) {
              // Error #5: Something went wrong while applying updater.
              if (error.name === 'StoreError') {
                return handleError(
                  new TransporterError('StoreError', 'Request failed (StoreError)', {
                    error: error.message,
                  }),
                  response.data,
                  optimisticData,
                );
              }

              throw error;
            }
          }

          // Complete request.
          dispatch({
            type: 'TRANSPORTER_REQUEST_COMPLETED',
            id: requestId,
            endTime: getTimestamp(),
            optimisticData,
            data,
          });

          return response;
        });
      },
      error => {
        // Error #6: Some network error occured.
        return handleError(
          new TransporterError('NetworkError', 'Request failed (NetworkError)', {
            error: error.message,
          }),
          null,
          optimisticData,
        );
      },
    );
  };
}
