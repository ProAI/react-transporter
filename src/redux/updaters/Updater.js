import AliasUpdater from './AliasUpdater';
import ConnectionUpdater from './ConnectionUpdater';
import { enforceArray } from '../../utils';

export default class Updater {
  constructor(dispatch) {
    this.dispatch = dispatch;
  }

  createAlias(alias, ids) {
    this.dispatch({
      type: 'TRANSPORTER_ALIASES_CREATE',
      alias,
      ids: enforceArray(ids),
    });
  }

  getAlias(alias) {
    return new AliasUpdater(this.dispatch, alias);
  }

  deleteAlias(alias) {
    this.dispatch({
      type: 'TRANSPORTER_ALIASES_DELETE',
      alias,
    });
  }

  getConnection(id, name) {
    return new ConnectionUpdater(this.dispatch, id, name);
  }

  deleteConnection(id, name) {
    this.dispatch({
      type: 'TRANSPORTER_ENTITIES_CONNECTION_DELETE',
      connection: {
        id,
        name,
      },
    });
  }
}
