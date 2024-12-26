import GraphDataSet from './network/GraphDataSet';

export default class Store {
  parentStore;

  executeQuery;

  children = [];

  requests;

  graphDataByRequest;

  listeners = [];

  marker = {};

  mounted = false;

  constructor(parentStore, executeQuery) {
    this.parentStore = parentStore;
    this.executeQuery = executeQuery;

    this.requests = new Map();
    this.graphDataByRequest = new Map();
  }

  preload = (ast, options = {}) => {
    const name =
      options.name ||
      ast.definitions.find((def) => def.kind === 'OperationDefinition')?.name
        .value;

    if (!name) {
      throw new Error('No query name found.');
    }

    let request = this.requests.get(name);

    // Invalidate request if variables have changed
    if (request && !request.isEqual(ast, options.variables)) {
      this.requests.delete(name);
      this.graphDataByRequest.delete(request);

      request.unmount();
      request = null;
    }

    // Create request if no request was found
    if (!request) {
      request = this.executeQuery(ast, { ...options, name });
      this.requests.set(name, request);
    }

    return name;
  };

  load = (ast, options) => {
    const name = this.preload(ast, options);
    return this.select(name);
  };

  getRequest = (name) => {
    let request = this.requests.get(name);

    if (!request) {
      if (!this.parentStore) {
        throw new Error(`Query "${name}" was not found.`);
      }

      request = this.parentStore.getRequest(name);
    }

    return request;
  };

  select = (name) => {
    const request = this.getRequest(name);

    // Check if request has loaded
    request.read();

    const queryData = request.cache.graphData.getQuery();

    if (!this.graphDataByRequest.has(request)) {
      this.graphDataByRequest.set(request, new GraphDataSet());
    }

    // Cache selector
    const graphData = this.graphDataByRequest.get(request);
    graphData.setQuery(queryData);

    return queryData;
  };

  waitForAll = () => {
    this.requests.forEach((request) => {
      request.read();
    });

    if (this.parentStore) {
      this.parentStore.waitForAll();
    }
  };

  getFragmentRequest = (name, entry) => {
    let request = Array.from(this.requests.values()).find(({ cache }) =>
      cache?.graphData.getFragment(name, entry),
    );

    if (!request) {
      if (!this.parentStore) {
        const stringifiedEntry = JSON.stringify(entry);
        throw new Error(
          `Fragment "${name}" (entry: [${stringifiedEntry}]) was not found.`,
        );
      }

      request = this.parentStore.getFragmentRequest(name, entry);
    }

    return request;
  };

  selectFragment = (name, entry) => {
    const request = this.getFragmentRequest(name, entry);

    // Check if request has loaded
    request.read();

    const fragmentData = request.cache.graphData.getFragment(name, entry);

    if (!this.graphDataByRequest.has(request)) {
      this.graphDataByRequest.set(request, new GraphDataSet());
    }

    // Cache selector
    const graphData = this.graphDataByRequest.get(request);
    graphData.setFragment(name, entry, fragmentData);

    return fragmentData;
  };

  addChild = (child) => {
    this.children = [...this.children, child];
  };

  removeChild = (child) => {
    this.children = this.children.filter((c) => c !== child);
  };

  subscribe = (listener) => {
    this.listeners = [...this.listeners, listener];

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  };

  getSnapshot = () => this.marker;

  refresh = () => {
    this.requests.forEach((request) => {
      request.sync();
    });

    let shouldUpdate = false;

    // Check if a selector has been updated. If so, the store node should
    // update and the listeneres should be called.
    this.graphDataByRequest.forEach((graphData, request) => {
      if (graphData.update(request.cache.graphData)) {
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      this.update();
    } else {
      this.children.forEach((child) => {
        child.refresh();
      });
    }
  };

  reset = (root = true) => {
    this.requests = new Map();
    this.graphDataByRequest = new Map();

    if (root) {
      this.update();
    }

    this.children.forEach((child) => {
      child.reset(false);
    });
  };

  update = () => {
    this.marker = {};

    this.listeners.forEach((listener) => {
      listener();
    });
  };

  mount = () => {
    this.mounted = true;

    // Add store to parent after mounting, so that not multiple unmounted
    // stores for the same node can be added.
    this.parentStore.addChild(this);
  };

  unmount = () => {
    this.mounted = false;

    // Remove network from parent store network children.
    this.parentStore.removeChild(this);

    // Delete requests.
    this.requests.forEach((request) => {
      request.unmount();
    });
  };
}
