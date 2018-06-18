import React from 'react';
import PropTypes from 'prop-types';
import RenderManager from './RenderManager';

const Component = () => import('components/User/Avatar');

const options = {
  options: {
    split: true,
    boundary: true, // can only be true if defer is false
    defer: true,
  },
};

const contextTypes = {
  store: PropTypes.object,
};

const es6Resolve = x =>
  (x != null && (typeof x === 'function' || typeof x === 'object') && x.default ? x.default : x);

class Container extends React.Component {
  constructor(props, context) {
    super(props, context);

    console.log('construct');

    const phase = RenderManager.getPhase();

    // If it is not defered (i.e. rendered/loaded on the server), we'll set the loading state to
    // false, otherwise to true.
    const loading = (phase === 'FIRST_RENDER' && options.defer) || phase === 'RENDER';
    const loadingState = [];

    const loaders = {};
    Object.keys(options.loaders).forEach((key) => {
      const loader = options.loaders[key](context.store.dispatch);

      loaders[key] = {
        loading,
        error: false,
        load: loader.getLoad(),
        ...loader.getProps(),
      };

      if (loading) {
        loadingState.push(key);
      }
    });

    // Is this a code split container?
    if (options.split) {
      loaders.bundle = {
        loading: phase === 'FIRST_RENDER' && options.defer,
        error: false,
        load: Component,
      };

      if (phase === 'FIRST_RENDER' && options.defer) {
        loadingState.push('bundle');
      }
    }

    this.loaders = loaders;

    this.state = {
      loaders,
      loading: loadingState,
      errors: [],
    };
  }

  componentDidMount() {
    const phase = RenderManager.getPhase();

    // Everything was loaded before on serverside, so don't do anything
    if (!((phase === 'FIRST_RENDER' && options.defer) || phase !== 'RENDER')) {
      return;
    }

    this.loadOnClient();
  }

  bootstrap() {
    // Loading screen will be rendered, so don't do anything on bootstrap
    if (options.defer) {
      return false;
    }

    const promises = [];

    // Wrap this.load function, so we can collect the promises.
    const load = (...args) => {
      // TODO don't use this.load, because we don't need to set state on callback
      promises.push(this.load(...args));
    };

    // Load all resources
    Object.keys(options.loaders).forEach((key) => {
      const loader = options.loaders[key]((...args) => load(key, , ...args));

      loader.init();
    });

    return Promise.all(promises).catch(errors => {
      results.forEach(error => {
        RenderManager
      });
    });
  }

  loadOnServer() {
    const env = RenderManager.getEnv();

    // Load code bundle
    /* if (options.split) {
      this.load('bundle', Component);
    }

    // Load other resources
    if (env === 'node') {
      Object.keys(options.loaders).forEach((key) => {
        const load = (action, loadOptions) => this.load(key, action, loadOptions);

        const customProps = options.loaders[key](load, this.props);
      });
    } */
  }

  loadOnClient() {
    const phase = RenderManager.getPhase();

    if (phase === 'RENDER') {
      // Load code bundle
      if (options.split && phase === 'FIRST_RENDER') {
        this.load('bundle', Component).then((module) => {
          Container.component = es6Resolve(module);
        });
      }

      // Load other resources
      Object.keys(options.loaders).forEach((key) => {
        const load = (action, loadOptions) => this.load(key, action, loadOptions);

        const customProps = options.loaders[key](load, this.props);
      });
    }
  }

  load(key, action, options) {
    // TODO add to loading (collect all start points)
    const promise = options.isReduxAction ? this.context.store.dispatch(action) : action();

    return promise
      .then(() => {
        // TODO: remove from loading
      })
      .catch(() => {
        // TODO: add error
      });
  }

  render() {
    // Some resources are loading
    if (Object.keys(this.state.loading).length > 0) {
      const LoadingComponent = options.fallbacks.loading;

      // TODO: add status of loaders/bundle
      return <LoadingComponent {...this.state.loaders} {...this.props} />;
    }

    // Some resources have an error
    if (Object.keys(this.state.errors).length > 0) {
      const ErrorComponent = options.fallbacks.error;

      // TODO: add status of loaders/bundle
      return <ErrorComponent {...this.state.loaders} {...this.props} />;
    }

    return <Container.Component {...this.state.loaders} {...this.props} />;
  }
}

Container.contextTypes = contextTypes;

export default Container;
