import Updater from './updater/Updater';

function integrateResponse(dispatch, integration, response) {
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
  if (integration) {
    const updater = new Updater(dispatch);
    integration(updater, {
      root: response.root,
      trash: response.trash,
    });
  }
}

export default integrateResponse;
