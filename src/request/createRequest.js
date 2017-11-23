import ActionCollector from './ActionCollector';

// TODO
// parse a real graphql schema
const parseSchema = schema => schema;
const getRequestName = schema => schema;
const getRootNames = schema => [schema];

const createOptimistcResponse = rootNames =>
  rootNames.map(rootName => ({
    [rootName]: {
      linked: null,
    },
  }));

export default function createRequest(request, fetch) {
  const schema = parseSchema(request.schema);
  const requestName = getRequestName(schema);
  const rootNames = getRootNames(schema);

  return (dispatch) => {
    // init request and apply optimistc response if set
    const optimisticActions = new ActionCollector();

    // add optimistic response for mutations
    if (request.type === 'TRANSPORTER_MUTATION' && request.optimisticUpdater) {
      optimisticActions.applyResponse(createOptimistcResponse(rootNames));
      optimisticActions.applyUpdater(request.optimisticUpdater);
    }

    try {
      dispatch({
        type: 'TRANSPORTER_REQUEST_START',
        name: requestName,
        actions: optimisticActions.getActions(),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);

      dispatch({
        type: 'TRANSPORTER_REQUEST_ERROR',
        name: requestName,
        error,
      });

      return;
    }

    // immediately stop request on server for now
    // TODO
    if (typeof window === 'undefined') {
      dispatch({
        type: 'TRANSPORTER_REQUEST_COMPLETED',
        name: requestName,
        actions: [],
      });
    }

    // pseudo fetch data on client for now
    // TODO
    if (typeof window !== 'undefined') {
      // dispatch query
      fetch(request.schema, request.variables).then(
        (response) => {
          // integrate response into store on success
          const actions = new ActionCollector();
          actions.applyResponse(response);
          actions.applyUpdater(request.updater, { roots: response.roots });

          try {
            dispatch({
              type: 'TRANSPORTER_REQUEST_COMPLETED',
              name: requestName,
              actions: actions.getActions(),
            });
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);

            dispatch({
              type: 'TRANSPORTER_REQUEST_ERROR',
              name: requestName,
              error,
            });
          }
        },
        (error) => {
          // update request status on error
          dispatch({
            type: 'TRANSPORTER_REQUEST_ERROR',
            name: requestName,
            error,
          });
        },
      );
    }
  };
}
