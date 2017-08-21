import Updater from './updaters/Updater';

function integrateResponse(dispatch, request, response) {
  // insert/update entities
  if (response.entities) {
    dispatch({
      type: 'TRANSPORTER_ENTITIES_UPDATE',
      entities: response.entities,
    });
  }

  // delete trashed entities
  if (response.trash) {
    dispatch({
      type: 'TRANSPORTER_ENTITIES_DELETE',
      ids: response.trash,
    });
  }

  // update connections/aliases
  if (request.integration) {
    const updater = new Updater(dispatch);
    request.integration(updater, {
      root: response.root,
      trash: response.trash,
    });
  }
}

export default integrateResponse;
