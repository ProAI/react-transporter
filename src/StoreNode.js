import makeSelectorKey from './network/makeSelectorKey';

/* eslint-disable arrow-body-style */
export default class StoreNode {
  parent;

  executeQuery;

  children = [];

  requests;

  selectorsByRequest;

  listeners = [];

  constructor(parent, executeQuery) {
    this.parent = parent;
    this.executeQuery = executeQuery;

    this.requests = new Map();
    this.selectorsByRequest = new Map();

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

  select = (name, options = {}) => {
    const request = this.getRequest(name);

    // Check if request has loaded
    request.read();

    const key = makeSelectorKey(options.fragment);
    const selector = request.cache.selectors[key];

    if (!selector) {
      throw new Error(`Selector for query "${name}" was not found.`);
    }

    // Cache selector
    if (this.selectorsByRequest.has(request)) {
      const selectors = this.selectorsByRequest.get(request);
      selectors.set(key, selector);
    } else {
      this.selectorsByRequest.set(request, new Map([[key, selector]]));
    }

    return selector.toObject();
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
    this.selectorsByRequest.forEach((selectors, request) => {
      selectors.forEach((selector, key) => {
        const requestSelector = request.cache.selectors[key];

        if (selector === requestSelector) {
          return;
        }

        selectors.set(key, requestSelector);
        shouldUpdate = true;
      });
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
/* eslint-enable */
