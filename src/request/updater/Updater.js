import AliasUpdater from './AliasUpdater';
import ConnectionUpdater from './ConnectionUpdater';

export default class Updater {
  constructor(dispatch) {
    this.dispatch = dispatch;
  }

  createAlias(name, idOrIds) {
    this.dispatch({
      type: 'TRANSPORTER_ALIAS_CREATE',
      name,
      idOrIds,
    });
  }

  getAlias(name) {
    return new AliasUpdater(this.dispatch, name);
  }

  deleteAlias(name) {
    this.dispatch({
      type: 'TRANSPORTER_ALIAS_DELETE',
      name,
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
