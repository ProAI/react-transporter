import Store from './Store';

/* eslint-disable arrow-body-style */
export default class Transporter {
  store;

  meta;

  ssr;

  constructor({ request, cache = {}, ssr = false }) {
    this.store = new Store({ request, cache, ssr }); // cache: cache.store?
    // this.meta = new Meta({ cache: cache.meta, ssr });

    this.ssr = ssr;
  }

  getMetaTags = () => {
    // TODO: Safely create meta tags, so that no injection is possible.
  };

  extract = () => {
    return {
      store: this.store.extract(),
      // meta: this.meta.extract(),
    };
  };
}
/* eslint-enable */
