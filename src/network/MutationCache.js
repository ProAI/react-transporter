import buildSelectorSet from './buildSelectorSet';

export default class MutationCache {
  request;

  data;

  selectorSet;

  constructor(request, data) {
    this.request = request;

    this.data = data;

    this.selectorSet = buildSelectorSet(this);
  }
}
