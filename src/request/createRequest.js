import WriteStore from './WriteStore';

// TODO
// parse a real graphql schema
const parseSchema = schema => schema;
const getRequestId = schema => schema;
const getOptimisticResponse = schema => ({ roots: { schema } });

function makeData(updater, getState, response, optimistic = false) {
  if (!updater) {
    return response;
  }

  const store = new WriteStore(getState().transporter, response, optimistic);
  updater(store, response); // TODO only pass in root and trashed ids of response
  return store.data;
}

export default function createRequest(request, fetch) {
  return (dispatch, getState) => {
    const schema = parseSchema(request.schema);
    const requestId = getRequestId(schema);
    const optimisticResponse = getOptimisticResponse(schema);
    const startTime = new Date();

    try {
      dispatch({
        type: 'TRANSPORTER_REQUEST_START',
        id: requestId,
        startTime,
        optimisticData:
          request.type === 'TRANSPORTER_MUTATION'
            ? makeData(request.optimisticUpdater, getState, optimisticResponse, true)
            : null,
      });
    } catch (error) {
      dispatch({
        type: 'TRANSPORTER_REQUEST_ERROR',
        id: requestId,
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

    // immediately stop request on server for now
    // TODO
    if (typeof window === 'undefined') {
      dispatch({
        type: 'TRANSPORTER_REQUEST_COMPLETED',
        id: requestId,
        startTime,
        endTime: new Date(),
        data: {
          entities: {},
          roots: {},
        },
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
              id: requestId,
              startTime,
              endTime: new Date(),
              data: makeData(request.updater, getState, response),
            });
          } catch (error) {
            dispatch({
              type: 'TRANSPORTER_REQUEST_ERROR',
              id: requestId,
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
            id: requestId,
            startTime,
            endTime: new Date(),
            error,
          });
        },
      );
    }
  };
}
