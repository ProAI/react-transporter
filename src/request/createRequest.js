import Transporter from '../core/Transporter';
import entityFactory from './entities/factory';
import integrateResponse from './integrateResponse';

function formatEntities(rawEntities) {
  const entities = {};
  rawEntities.forEach((rawEntity) => {
    const id = rawEntity.getId();
    // if there is no type entry, create one
    if (!entities[id[0]]) {
      entities[id[0]] = {};
    }

    // add entity
    entities[id[0]][id[1]] = rawEntity.attributes;
  });

  return entities;
}

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

      optimisticResponse.entities = formatEntities(optimisticResponse.entities);

      integrateResponse(dispatch, request.integration, optimisticResponse);
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
        // integrateResponse(dispatch, request.integration, response);
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
