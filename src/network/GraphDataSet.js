const getFragmentKey = (name, type, id) => `${name}.${type}.${id}`;

/* eslint-disable arrow-body-style */
export default class GraphDataSet {
  query = null;

  fragments = {};

  getQuery = () => {
    return this.query;
  };

  setQuery = (data) => {
    this.query = data;
  };

  getFragment = (name, type, id) => {
    const key = getFragmentKey(name, type, id);

    return this.fragments[key];
  };

  setFragment = (name, type, id, data) => {
    const key = getFragmentKey(name, type, id);

    this.fragments[key] = data;
  };

  update = (graphData) => {
    let changed = false;

    if (this.query) {
      if (this.query !== graphData.query) {
        this.query = graphData.query;
        changed = true;
      }
    }

    Object.keys(this.fragments).forEach((key) => {
      if (this.fragments[key] !== graphData.fragments[key]) {
        this.fragments[key] = graphData.fragments[key];
        changed = true;
      }
    });

    return changed;
  };
}
/* eslint-enable */
