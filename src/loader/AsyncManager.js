// @flow
const canUseDOM = typeof window !== 'undefined';

class AsyncManager {
  env: 'browser' | 'node';

  phase: 'BOOTSTRAPPING' | 'FIRST_RENDER' | 'RENDER';

  constructor() {
    this.env = canUseDOM ? 'browser' : 'node';
    this.phase = 'BOOTSTRAPPING';

    // eslint-disable-next-line
    this.errors = canUseDOM && window.__ASYNC_DATA__ ? window.__ASYNC_DATA__.errors : {};
    // eslint-disable-next-line
    this.ssr = !canUseDOM || (canUseDOM && window.__ASYNC_DATA__ && !!window.__ASYNC_DATA__.errors);
    this.ids = {};
  }

  isSSREnabled() {
    return this.ssr;
  }

  generateId(name) {
    const id = this.ids[name] ? this.ids[name] + 1 : 1;

    this.ids[name] = id;

    return id;
  }

  setPhaseToFirstRender() {
    this.phase = 'FIRST_RENDER';
    this.ids = {};
  }

  setPhaseToRender() {
    this.phase = 'RENDER';
    this.ids = {};
  }

  addError(id, key, error) {
    if (!this.errors[id]) this.errors[id] = {};

    this.errors[id][key] = error;
  }

  getError(id, key) {
    if (
      !this.errors[id] ||
      !this.errors[id][key] ||
      Object.keys(this.errors[id][key]).length === 0
    ) {
      return null;
    }

    return this.errors[id][key];
  }

  getErrors() {
    return this.errors;
  }

  getEnv() {
    return this.env;
  }

  getPhase() {
    return this.phase;
  }
}

const AsyncManagerInstance = new AsyncManager();

export default AsyncManagerInstance;
