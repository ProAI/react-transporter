import Updater from './updater/Updater';
import { enforceArray } from '../utils';

function integrateResponse(dispatch, integration, response) {
  // insert/update entities
  if (response && response.entities) {
    dispatch({
      type: 'TRANSPORTER_ENTITIES_UPDATE',
      entities: response.entities,
    });
  }

  // delete trashed entities
  if (response && response.trash) {
    dispatch({
      type: 'TRANSPORTER_ENTITIES_DELETE',
      ids: enforceArray(response.trash),
    });
  }

  // update connections/aliases
  if (integration) {
    const updater = new Updater(dispatch);
    integration(updater, {
      root: response && response.root,
      trash: response && response.trash,
    });
  }
}

export default integrateResponse;
