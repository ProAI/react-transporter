import React from 'react';
import PropTypes from 'prop-types';
import RenderManager from './RenderManager';

const contextTypes = {
  store: PropTypes.object,
};

export default function createContainer(component, config) {
  const phase = RenderManager.getPhase();

  const isPreload =
    !config.options.defer && (phase === 'BOOTSTRAPPING' || phase === 'FIRST_RENDER');
  const isServer = RenderManager.getEnv() === 'node';

  const containerName = () =>
    `${config.options.name}-${RenderManager.generateId(config.options.name)}`;
  const getError = key => (isPreload ? RenderManager.getError(containerName, key) : null);
  const addError = (key, error) => RenderManager.addError(containerName, key, error);

  const getComponent = () => RenderManager.getComponent(config.options.name);
  const addComponent = module => RenderManager.addComponent(config.options.name, module);

  class Container extends React.Component {
    constructor(props, context) {
      super(props, context);

      // Set bundle loading & errors
      const loading = config.options.split
        ? {
          bundle: isPreload ? false : !!RenderManager.getComponent(config.options.name),
        }
        : {};
      const errors = config.options.split
        ? {
          bundle: getError('bundle'),
        }
        : {};

      // Set resources loading & errors
      Object.keys(config.loaders).forEach((key) => {
        loading[key] = !isPreload;
        errors[key] = getError(key);
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
            const promise = this.load(key, action, options);

            promises.push(promise);
          });
        });
      }

      // Load code bundle if present on server & client
      if (config.options.split) {
        const promise = this.load('bundle', component);

        promises.push(promise);
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

    load(key, action, options, changeLoadingState = false) {
      if (changeLoadingState) {
        this.setState({
          loading: {
            [key]: true,
          },
        });
      }

      const promise = options.isReduxAction ? this.context.store.dispatch(action) : action();

      promise
        .then((result) => {
          // Save component if request was done for a component
          if (key === 'bundle') {
            addComponent(result);
          }

          // Update state if component did mount
          if (!isPreload) {
            this.setState(({ loading, errors }) => ({
              loading: {
                [key]: false,
                ...loading,
              },
              errors: {
                [key]: null,
                ...errors,
              },
            }));
          }
        })
        .catch((error) => {
          // Update state if component did mount
          if (!isPreload) {
            this.setState(({ loading, errors }) => ({
              loading: {
                [key]: false,
                ...loading,
              },
              errors: {
                [key]: error,
                ...errors,
              },
            }));
          } else {
            addError(key, error);

            this.state.errors[key] = error;
          }
        });

      return promise;
    }

    updateState(key, loading, error) {
      this.setState(({ loading, errors }) => ({
        loading: {
          [key]: false,
          ...loading,
        },
        errors: {
          [key]: error,
          ...errors,
        },
      }));
    }

    render() {
      // Create loader props
      const loaderProps = {};
      Object.keys(config.loaders).forEach((key) => {
        const loader = config.loaders[key];

        loaderProps[key] = loader.props((action, options) => this.load(key, action, options, true));
      });

      // Some resources are loading
      if (Object.values(this.state.loading).some(element => element)) {
        const LoadingComponent = config.fallbacks.loading;

        // TODO: add status of loaders/bundle!!!
        return <LoadingComponent {...loaderProps} {...this.props} />;
      }

      // Some resources have an error
      if (Object.keys(this.state.errors).some(element => element !== null)) {
        const ErrorComponent = config.fallbacks.error;

        // TODO: add status of loaders/bundle!!!
        return <ErrorComponent {...loaderProps} {...this.props} />;
      }

      const Component = config.options.split ? getComponent() : component;
      return <Component {...loaderProps} {...this.props} />;
    }
  }

  Container.contextTypes = contextTypes;

  return Container;
}
