import { enforceArray } from '../../utils';

export default class AliasUpdater {
  constructor(dispatch, alias) {
    this.dispatch = dispatch;
    this.alias = alias;
  }

  add(ids) {
    this.dispatch({
      type: 'TRANSPORTER_ALIASES_PUSH',
      alias: this.alias,
      ids: enforceArray(ids),
    });
  }

  remove(ids) {
    this.dispatch({
      type: 'TRANSPORTER_ALIASES_SLICE',
      alias: this.alias,
      ids: enforceArray(ids),
    });
  }
}
