import { enforceArray } from '../../utils';

export default class AliasUpdater {
  constructor(dispatch, name) {
    this.dispatch = dispatch;
    this.name = name;
  }

  update(id) {
    this.dispatch({
      type: 'TRANSPORTER_ALIAS_UPDATE',
      name: this.name,
      id,
    });
  }

  add(idOrIds) {
    const ids = enforceArray(idOrIds);

    this.dispatch({
      type: 'TRANSPORTER_ALIAS_PUSH',
      name: this.name,
      ids,
    });
  }

  remove(idOrIds) {
    const ids = enforceArray(idOrIds);

    this.dispatch({
      type: 'TRANSPORTER_ALIAS_SLICE',
      name: this.name,
      ids,
    });
  }
}
