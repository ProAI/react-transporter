import { enforceArray } from '../../utils';

export default class ConnectionUpdater {
  constructor(dispatch, id, name) {
    this.dispatch = dispatch;
    this.id = id;
    this.name = name;
  }

  update(id) {
    this.dispatch({
      type: 'TRANSPORTER_ENTITIES_CONNECTION_UPDATE',
      connection: {
        id: this.id,
        name: this.name,
      },
      id,
    });
  }

  add(idOrIds) {
    const ids = enforceArray(idOrIds);

    this.dispatch({
      type: 'TRANSPORTER_ENTITIES_CONNECTION_PUSH',
      connection: {
        id: this.id,
        name: this.name,
      },
      ids,
    });
  }

  remove(idOrIds) {
    const ids = enforceArray(idOrIds);

    this.dispatch({
      type: 'TRANSPORTER_ENTITIES_CONNECTION_SLICE',
      connection: {
        id: this.id,
        name: this.name,
      },
      ids,
    });
  }
}
