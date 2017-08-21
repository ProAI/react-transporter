import Transporter from '../core/Transporter';
import entityFactory from './entityFactory';
import integrateResponse from './integrateResponse';

export default function createRequest(request) {
  return (dispatch) => {
    // init request status
    dispatch({
      type: 'TRANSPORTER_REQUESTS_START',
      name: request.name,
    });

    // apply optimistic response on mutations
    if (request.mutation && request.optimisticResponse) {
      const optimisticResponse = request.optimisticResponse(entityFactory);

      integrateResponse(dispatch, request, optimisticResponse);
    }

    // dispatch query
    Transporter.fetch(request.query || request.mutation, request.variables).then(
      () => {
        // update request status on success
        dispatch({
          type: 'TRANSPORTER_REQUESTS_COMPLETED',
          name: request.name,
        });

        // TODO
        // integrateResponse(dispatch, request, response);
      },
      (error) => {
        // update request status on error
        dispatch({
          type: 'TRANSPORTER_REQUESTS_ERROR',
          name: request.name,
          error,
        });
      },
    );
  };
}
