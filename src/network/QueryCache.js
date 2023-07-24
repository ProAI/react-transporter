import buildSelectors from './buildSelectors';

/* eslint-disable arrow-body-style */
export default class QueryCache {
  request;

  original;

  updates = [];

  dirty = true;

  data;

  selectors = [];

  constructor(request, original) {
    this.request = request;

    this.original = original;
    this.data = original;
  }

  addUpdate = (data, optimistic = false) => {
    if (!this.data.intersectWith(data)) {
      return;
    }

    this.dirty = true;

    const update = {
      optimistic,
      data,
      cache: this.data.mutate(data),
    };

    this.data = data;
    this.updates = [...this.updates, update];
  };

  removeUpdate = (data) => {
    let found = false;
    const updates = [];

    this.updates.forEach((update) => {
      if (update.data === data) {
        this.dirty = true;
        found = true;
      } else if (found) {
        const { length } = updates;
        const prevData = length > 0 ? updates[length - 1].cache : this.original;

        updates.push({
          ...update,
          cache: prevData.mutate(data),
        });
      } else {
        updates.push(update);
      }
    });

    this.updates = updates;
  };

  commit = () => {
    if (!this.dirty) {
      return;
    }

    // (Re-)build data of selectors
    this.selectors = buildSelectors(this);

    // Update original data if there are no optimistic updates
    if (!this.updates.some((u) => u.optimistic)) {
      this.original = this.data;
      this.updates = [];
    }

    this.dirty = false;
  };
}
/* eslint-enable */
