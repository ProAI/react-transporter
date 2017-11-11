import Updater from './updater/Updater';
import { enforceArray } from '../utils';

function integrateResponse(dispatch, integration, response) {
  const entities = response.getEntities();
  const root = response.getRoot();
  const trash = response.getTrash();

  // insert/update entities
  if (entities) {
    dispatch({
      type: 'TRANSPORTER_ENTITIES_UPDATE',
      entities,
    });
  }

  // delete trashed entities
  if (trash) {
    dispatch({
      type: 'TRANSPORTER_ENTITIES_DELETE',
      ids: enforceArray(trash),
    });
  }

  // update connections/aliases
  if (integration) {
    const updater = new Updater(dispatch);
    integration(updater, { root, trash }, dispatch);
  }
}

export default integrateResponse;
