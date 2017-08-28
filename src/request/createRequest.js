import Response from './response/Response';
import integrateResponse from './integrateResponse';
import { getRequestName } from '../utils';

export default function createRequest(request, fetch) {
  const requestName = request.name || getRequestName(request.schema);

  return (dispatch) => {
    // init request status
    dispatch({
      type: 'TRANSPORTER_REQUEST_START',
      name: requestName,
    });

    // immediately stop request on server for now
    // TODO
    // collect all requests on server, then send ONE request to server
    if (typeof window === 'undefined') {
      dispatch({
        type: 'TRANSPORTER_REQUEST_COMPLETED',
        name: requestName,
      });
    }

    if (typeof window !== 'undefined') {
      // apply optimistic response on mutations
      if (request.type === 'TRANSPORTER_MUTATION' && request.optimisticResponse) {
        const optimisticResponse = request.optimisticResponse(new Response());

        integrateResponse(dispatch, request.integration, optimisticResponse);
      }

      // dispatch query
      fetch(request.schema, request.variables).then(
        () => {
          // update request status on success
          dispatch({
            type: 'TRANSPORTER_REQUEST_COMPLETED',
            name: requestName,
          });

          // TODO
          // integrateResponse(dispatch, request.integration, response);
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
