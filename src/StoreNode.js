import SelectorSet from './network/SelectorSet';

export default class StoreNode {
  parent;

  executeQuery;

  children = [];

  requests;

  selectorSetsByRequest;

  listeners = [];

  constructor(parent, executeQuery) {
    this.parent = parent;
    this.executeQuery = executeQuery;

    this.requests = new Map();
    this.selectorSetsByRequest = new Map();

    if (parent) {
      parent.addChild(this);
    }
  }

  preload = (query, options = {}) => {
    const name =
      options.name ||
      query.definitions.find((def) => def.kind === 'OperationDefinition')?.name
        .value;

    if (!name) {
      throw new Error('No query name found.');
    }

    let request = this.requests.get(name);

    // Invalidate request if variables have changed
    if (request && !request.isEqual(query, options.variables)) {
      this.requests.delete(name);
      this.selectorSetsByRequest.delete(name);

      request.invalidate();
      request = null;
    }

    // Create request if no request was found
    if (!request) {
      request = this.executeQuery(query, { ...options, name });
      this.requests.set(name, request);
    }

    return name;
  };

  load = (query, options) => {
    const name = this.preload(query, options);
    return this.select(name);
  };

  getRequest = (name) => {
    let request = this.requests.get(name);

    if (!request) {
      if (!this.parent) {
        throw new Error(`Query "${name}" was not found.`);
      }

      request = this.parent.getRequest(name);
    }

    return request;
  };

  select = (name) => {
    const request = this.getRequest(name);

    // Check if request has loaded
    request.read();

    const data = request.cache.selectorSet.getQuery();

    if (!this.selectorSetsByRequest.has(request)) {
      this.selectorSetsByRequest.set(request, new SelectorSet());
    }

    // Cache selector
    const selectorSet = this.selectorSetsByRequest.get(request);
    selectorSet.setQuery(data);

    return data;
  };

  getFragmentRequest = (name, entry) => {
    let request = Array.from(this.requests.values()).find(({ cache }) =>
      cache?.selectorSet.getFragment(name, entry),
    );

    if (!request) {
      if (!this.parent) {
        const stringifiedEntry = JSON.stringify(entry);
        throw new Error(
          `Fragment "${name}" (entry: [${stringifiedEntry}]) was not found.`,
        );
      }

      request = this.parent.getFragmentRequest(name, entry);
    }

    return request;
  };

  selectFragment = (name, entry) => {
    const request = this.getFragmentRequest(name, entry);

    // Check if request has loaded
    request.read();

    const data = request.cache.selectorSet.getFragment(name, entry);

    if (!this.selectorSetsByRequest.has(request)) {
      this.selectorSetsByRequest.set(request, new SelectorSet());
    }

    // Cache selector
    const selectorSet = this.selectorSetsByRequest.get(request);
    selectorSet.setFragment(name, entry, data);

    return data;
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

  refresh = () => {
    this.requests.forEach((request) => {
      request.sync();
    });

    let shouldUpdate = false;

    // Check if a selector has been updated. If so, the store node should
    // update and the listeneres should be called.
    this.selectorSetsByRequest.forEach((selectorSet, request) => {
      if (selectorSet.update(request.cache.selectorSet)) {
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      this.listeners.forEach((listener) => {
        listener();
      });
    } else {
      this.children.forEach((child) => {
        child.refresh();
      });
    }
  };

  reset = () => {
    this.requests = new Map();

    this.children.forEach((child) => {
      child.reset();
    });
  };

  destroy = () => {
    // Remove network from parent's network children.
    this.parent.removeChild(this);

    // Delete requests.
    this.requests.forEach((request) => {
      request.invalidate();
    });
  };
}
