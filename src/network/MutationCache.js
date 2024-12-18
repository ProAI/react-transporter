import buildGraphDataSet from './buildGraphDataSet';

export default class MutationCache {
  request;

  data;

  graphData;

  constructor(request, data) {
    this.request = request;

    this.data = data;

    this.graphData = buildGraphDataSet(this);
  }
}
