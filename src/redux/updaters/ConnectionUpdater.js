import { enforceArray } from '../../utils';

export default class ConnectionUpdater {
  constructor(dispatch, id, name) {
    this.dispatch = dispatch;
    this.id = id;
    this.name = name;
  }

  add(ids) {
    this.dispatch({
      type: 'TRANSPORTER_ENTITIES_CONNECTION_PUSH',
      connection: {
        id: this.id,
        name: this.name,
      },
      ids: enforceArray(ids),
    });
  }

  remove(ids) {
    this.dispatch({
      type: 'TRANSPORTER_ENTITIES_CONNECTION_SLICE',
      connection: {
        id: this.id,
        name: this.name,
      },
      ids: enforceArray(ids),
    });
  }
}
