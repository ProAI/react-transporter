import WriteStore from './WriteStore';
import generateId from '../utils/generateId';
import getTimestamp from '../utils/getTimestamp';
import TransporterError from '../errors/TransporterError';
import StoreError from '../errors/StoreError';

const TRANSPORTER_STATE = 'transporter';

let customHandleError;
export function onError(callback) {
  customHandleError = callback;
}

export default function createRequest(request, fetch) {
  const startTime = getTimestamp();
  const isMutation = request.type === 'TRANSPORTER_MUTATION';

  const requestId = request.id || generateId();
  const requestBody = isMutation
    ? request.mutation.loc.source.body
    : request.query.loc.source.body;

  function getStoreData(updater, state, responseData) {
    const storeData = responseData ? { ...responseData } : null;

    // Don't apply roots for mutations.
    if (storeData && isMutation) {
      delete storeData.roots;
    }

    if (!updater) {
      return storeData;
    }

    const store = new WriteStore(state[TRANSPORTER_STATE], storeData);

    updater(store, responseData);

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

      if (customHandleError) {
        customHandleError(error, request);
      }

      return Promise.reject(error);
    }

    // Create optimisticData if request is of type mutation.
    let optimisticData;
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

          if (customHandleError) {
            customHandleError(transporterError);
          }

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
        return result.json().then(
          response => {
            // Error #2: Http error code detected, throw error.
            if (!result.ok) {
              return handleError(
                new TransporterError(
                  'HttpError',
                  `Request failed (HttpError - ${result.status})`,
                  response,
                  result.status,
                ),
                null,
                optimisticData,
              );
            }

            const state = getState();

            // Error #3: In the meantime the store was resetted, so do not apply response.
            if (state[TRANSPORTER_STATE].info.lastReset >= startTime) {
              const error = new StoreError(
                'Store reset after request was started.',
              );

              return handleError(
                new TransporterError(
                  'StoreError',
                  'Request failed (StoreError)',
                  {
                    error: error.message,
                  },
                ),
                null,
                null,
              );
            }

            // Error #4: Response has GraphQL errors, throw error.
            if (response.errors) {
              response.errors.forEach(error => {
                // eslint-disable-next-line no-console
                console.error(`GraphQLError: ${error.message}`);
              });

              return handleError(
                new TransporterError(
                  'GraphQLError',
                  'Request failed (GraphQLError)',
                  {
                    errors: response.errors,
                  },
                ),
                response.data,
                optimisticData,
              );
            }

            // Response is okay.
            let data;
            if (response.data) {
              try {
                data = getStoreData(request.updater, state, response.data);
              } catch (error) {
                // Error #5: Something went wrong while applying updater.
                if (error.name === 'StoreError') {
                  return handleError(
                    new TransporterError(
                      'StoreError',
                      'Request failed (StoreError)',
                      {
                        error: error.message,
                      },
                    ),
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

            return response.data;
          },
          error => {
            // Error #6: Http error code with invalid JSON detected, throw error.
            if (!result.ok) {
              return handleError(
                new TransporterError(
                  'HttpError',
                  `Request failed (HttpError - ${result.status})`,
                  null,
                  result.status,
                ),
                null,
                optimisticData,
              );
            }

            // Error #7: Found JSON parsing error.
            return handleError(
              new TransporterError('JsonError', `${error.message} (JsonError)`),
              null,
              optimisticData,
            );
          },
        );
      },
      error => {
        // Error #8: Some network error occured.
        return handleError(
          new TransporterError(
            'NetworkError',
            `${error.message} (NetworkError)`,
          ),
          null,
          optimisticData,
        );
      },
    );
  };
}
