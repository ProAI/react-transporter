import React from 'react';
import PropTypes from 'prop-types';
import RenderManager from './RenderManager';

const contextTypes = {
  store: PropTypes.object,
};

export default function createContainer(component, customConfig) {
  const config = {
    loaders: customConfig.loaders || {},
    fallbacks: customConfig.fallbacks || {},
    options: Object.assign(
      {},
      {
        split: false,
        defer: true,
        name: 'Test',
      },
      customConfig.options,
    ),
  };

  const phase = RenderManager.getPhase();

  const isPreload =
    !config.options.defer && (phase === 'BOOTSTRAPPING' || phase === 'FIRST_RENDER');
  const isServer = RenderManager.getEnv() === 'node';

  const getComponent = () => RenderManager.getComponent(config.options.name);
  const addComponent = module => RenderManager.addComponent(config.options.name, module);

  const getError = (name, key) => (isPreload ? RenderManager.getError(name, key) : null);
  const addError = (name, key, error) => RenderManager.addError(name, key, error);

  class Container extends React.Component {
    constructor(props, context) {
      super(props, context);

      // Set unmounted to false
      this.hasUnmounted = false;

      // Set containerName
      if (isPreload) {
        this.containerName = `${config.options.name}-${RenderManager.generateId(config.options.name)}`;
      }

      // Set bundle loading & errors
      const loading = config.options.split
        ? {
          bundle: isPreload ? false : !!getComponent(),
        }
        : {};
      const errors = config.options.split
        ? {
          bundle: getError(this.containerName, 'bundle'),
        }
        : {};

      // Set resources loading & errors
      Object.keys(config.loaders).forEach((key) => {
        loading[key] = !isPreload;
        errors[key] = getError(this.containerName, key);
      });

      // Set state
      this.state = {
        loading,
        errors,
      };

      // Bind load method
      this.load = this.load.bind(this);
    }

    // eslint-disable-next-line react/sort-comp
    bootstrap() {
      console.log('bootstrap called');

      // We don't need to do something during bootstrapping if loading is deferred
      if (!isPreload) {
        return false;
      }

      const promises = [];

      // Load resources on server
      if (isServer) {
        // Iterate over loaders to load resources initially
        Object.keys(config.loaders).forEach((key) => {
          const loader = config.loaders[key];

          loader.init((action, options) => {
            promises.push(this.load(key, action, options));
          });
        });
      }

      // Load code bundle if present on server & client
      if (config.options.split) {
        promises.push(this.load('bundle', component));
      }

      // Return composed promises
      return Promise.all(promises);
    }

    componentDidMount() {
      // We don't need to do something if resources were preloaded
      if (isPreload) {
        return;
      }

      // Iterate over loaders to load resources initially
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        loader.init((action, options) => this.load(key, action, options));
      });

      // Load code bundle if present on server & client
      if (config.options.split && !getComponent()) {
        this.load('bundle', component);
      }
    }

    load(key, action, options = {}) {
      const promise = options.isReduxAction ? this.context.store.dispatch(action) : action();

      return promise
        .then((result) => {
          // Save component if request was done for a component
          if (key === 'bundle') {
            addComponent(result);
          }

          // Update state if component did mount
          if (!isPreload && !this.hasUnmounted) {
            this.setRequestState(key, false, null);
          }
        })
        .catch((error) => {
          // Update state if component did mount
          if (!isPreload) {
            if (!this.hasUnmounted) {
              this.setRequestState(key, false, error);
            }
          } else {
            addError(this.containerName, key, error);

            this.state.errors[key] = error;
          }
        });
    }

    componentWillUnmount() {
      this.hasUnmounted = true;
    }

    setRequestState(key, updatedLoading, updatedError) {
      this.setState(({ loading, errors }) => ({
        loading: {
          [key]: updatedLoading,
          ...loading,
        },
        errors: {
          [key]: updatedError === undefined ? errors[key] : updatedError,
          ...errors,
        },
      }));
    }

    render() {
      // Create loader props
      const loaderProps = {};
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        loaderProps[key] = loader.props((action, options) => {
          if (this.state.loading[key]) {
            // eslint-disable-next-line no-console
            console.error(`Resource ${config.options.name} ${key} is already loading.`);
          } else {
            this.setRequestState(key, true);

            this.load(key, action, options);
          }
        });
      });

      // Some resources are loading
      if (Object.values(this.state.loading).some(element => element)) {
        const LoadingComponent = config.fallbacks.loading;

        return <LoadingComponent {...loaderProps} {...this.props} />;
      }

      // Some resources have an error
      if (Object.keys(this.state.errors).some(element => element === null)) {
        const ErrorComponent = config.fallbacks.error;

        return <ErrorComponent {...loaderProps} {...this.props} />;
      }

      const Component = config.options.split ? getComponent() : component;
      console.log(this.containerName);
      console.log(Component);

      return <Component {...loaderProps} {...this.props} />;
    }
  }

  Container.contextTypes = contextTypes;

  return Container;
}
