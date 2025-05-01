import GraphDataSet from './network/GraphDataSet';
import { TYPENAME, ID } from './constants';

export default class Store {
  parentStore;

  executeQuery;

  syncMode;

  children = [];

  requests;

  graphDataByRequest;

  listeners = [];

  marker = {};

  mounted = false;

  constructor(parentStore, executeQuery, syncMode) {
    this.parentStore = parentStore;
    this.executeQuery = executeQuery;
    this.syncMode = syncMode;

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
    if (this.syncMode) {
      throw new Error('load() cannot be called in sync mode.');
    }

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
    if (this.syncMode) {
      throw new Error('select() cannot be called in sync mode.');
    }

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

  getFragmentRequest = (name, type, id) => {
    let request = Array.from(this.requests.values()).find(({ cache }) =>
      cache?.graphData.getFragment(name, type, id),
    );

    if (!request) {
      if (!this.parentStore) {
        throw new Error(
          `Fragment "${name}" (entry: [${type}, ${id}]) was not found.`,
        );
      }

      request = this.parentStore.getFragmentRequest(name, type, id);
    }

    return request;
  };

  selectFragment = (name, entity) => {
    if (this.syncMode) {
      throw new Error('selectFragment() cannot be called in sync mode.');
    }

    const { [TYPENAME]: type, [ID]: id } = entity;

    const request = this.getFragmentRequest(name, type, id);

    // Check if request has loaded
    request.read();

    const fragmentData = request.cache.graphData.getFragment(name, type, id);

    if (!this.graphDataByRequest.has(request)) {
      this.graphDataByRequest.set(request, new GraphDataSet());
    }

    // Cache selector
    const graphData = this.graphDataByRequest.get(request);
    graphData.setFragment(name, type, id, fragmentData);

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

    // Traverse tree to update all child stores.
    this.children.forEach((child) => {
      child.refresh();
    });

    // Check if a selector has been updated. If so, the store node should
    // update and the listeneres should be called.
    this.graphDataByRequest.forEach((graphData, request) => {
      if (!request.cache) {
        this.graphDataByRequest.delete(request);
      }
      if (!request.cache || graphData.update(request.cache.graphData)) {
        this.update();
      }
    });
  };

  resetAborted = (root = true) => {
    // Unmount requests that failed.
    this.requests.forEach((request, name) => {
      if (request.isAborted()) {
        this.requests.delete(name);
        this.graphDataByRequest.delete(request);

        request.unmount();
      }
    });

    this.children.forEach((child) => {
      child.resetAborted(false);
    });

    if (root) {
      this.update();
    }
  };

  reset = (root = true) => {
    // Unmount requests.
    this.requests.forEach((request) => {
      request.unmount();
    });

    this.requests = new Map();
    this.graphDataByRequest = new Map();

    this.children.forEach((child) => {
      child.reset(false);
    });

    if (root) {
      this.update();
    }
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

    // Mount requests.
    this.requests.forEach((request) => {
      request.mount();
    });
  };

  unmount = () => {
    this.mounted = false;

    // Remove network from parent store network children.
    this.parentStore.removeChild(this);

    // Unmount requests.
    this.requests.forEach((request) => {
      request.unmount();
    });
  };
}
