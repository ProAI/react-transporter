// @flow
const canUseDOM = typeof window !== 'undefined';

class AsyncManager {
  env: 'browser' | 'node';
  phase: 'BOOTSTRAPPING' | 'FIRST_RENDER' | 'RENDER';

  constructor() {
    this.env = canUseDOM ? 'browser' : 'node';
    this.phase = 'BOOTSTRAPPING';

    // eslint-disable-next-line
    this.errors = canUseDOM ? window.__LOADER_ERRORS__ : {};
    this.ids = {};
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
    if (!this.errors[id] || !this.errors[id][key]) return null;

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
