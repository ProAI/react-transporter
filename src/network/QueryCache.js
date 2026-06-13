import buildGraphDataSet from './buildGraphDataSet';
import buildDataSet from './buildDataSet';

/* eslint-disable arrow-body-style */
export default class QueryCache {
  request;

  original;

  updates = [];

  dirty = false;

  data;

  graphData;

  constructor(request, original) {
    this.request = request;

    this.original = original;
    this.data = original;

    this.graphData = buildGraphDataSet(this);
  }

  addUpdate = (data, optimistic = false) => {
    if (!this.data.intersectWith(data)) {
      return;
    }

    this.dirty = true;

    const updatedData = this.data.merge(data);

    const update = {
      optimistic,
      data,
      cache: updatedData,
    };

    this.data = updatedData;
    this.updates = [...this.updates, update];
  };

  removeUpdate = (data) => {
    let found = false;
    let updatedData;
    const updates = [];

    this.updates.forEach((update) => {
      if (update.data === data) {
        this.dirty = true;
        found = true;

        // data is data from previous update (or original data)
        const { length } = updates;
        updatedData = length > 0 ? updates[length - 1].cache : this.original;
      } else if (found) {
        // data is data from previous update (or original data) + data of update
        const { length } = updates;
        const prevData = length > 0 ? updates[length - 1].cache : this.original;
        updatedData = prevData.merge(data);

        updates.push({
          ...update,
          cache: updatedData,
        });
      } else {
        updates.push(update);
      }
    });

    if (updatedData) {
      this.data = updatedData;
    }
    this.updates = updates;
  };

  commit = () => {
    if (!this.dirty) {
      return;
    }

    // (Re-)build data of selectors
    this.graphData = buildGraphDataSet(this);

    // Update original data if there are no optimistic updates
    if (!this.updates.some((u) => u.optimistic)) {
      // Rebuild data set to remove data that is not part of the graph
      this.original = buildDataSet(this);
      this.data = this.original;
      this.updates = [];
    }

    this.dirty = false;
  };
}
/* eslint-enable */
