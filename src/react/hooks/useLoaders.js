import { useEffect, useState, createElement, useMemo } from 'react';
import useCache from './useCache';
import useStore from './useStore';
import getTimestamp from '../../utils/getTimestamp';
import enhanceWithConnect from '../utils/enhanceWithConnect';

const isSSR = typeof window === 'undefined';

const resolveES6 = (x) =>
  x != null && (typeof x === 'function' || typeof x === 'object') && x.default
    ? x.default
    : x;

const prepareComponent = (Component, connected) =>
  connected ? enhanceWithConnect(Component) : Component;

const updateState = (key, data) => (prevState) => ({
  ...prevState,
  [key]: { ...prevState[key], ...data },
});

export default function useLoaders(component, config, options) {
  const cache = useCache();
  const store = useStore();

  const hasCodeSplit = !!(component.name && component.bundle);
  const connected = config.selectors || config.actions;
  const meta = useMemo(
    () => ({
      queue: [],
      component: !hasCodeSplit ? prepareComponent(component, connected) : null,
      phase: 'MOUNTING',
    }),
    [],
  );

  useEffect(() => {
    meta.phase = 'MOUNTED';

    return () => {
      meta.phase = 'UNMOUNTED';
    };
  }, []);

  // Create initial loaders state
  const initialState = () => {
    const loaderTimes = {
      startTime: getTimestamp(),
      endTime: null,
    };

    const state = {};

    if (hasCodeSplit) {
      state.bundle = {
        ...loaderTimes,
        loading: hasCodeSplit,
        error: null,
      };
    }

    Object.keys(config.loaders).forEach((key) => {
      state[key] = {
        ...loaderTimes,
        loading: true,
        error: null,
      };
    });

    return state;
  };

  const [state, setState] = useState(initialState);

  const createLoad = (key) => (promise) =>
    promise
      .then((result) => {
        // Save component if request was done for a component
        if (key === 'bundle') {
          meta.component = prepareComponent(resolveES6(result), connected);
        }

        if (meta.phase === 'UNMOUNTED') {
          return;
        }

        setState(
          updateState(key, {
            endTime: getTimestamp(),
            loading: false,
            error: null,
          }),
        );
      })
      .catch((error) => {
        if (meta.phase === 'UNMOUNTED') {
          return;
        }

        setState(
          updateState(key, {
            endTime: getTimestamp(),
            loading: false,
            error,
          }),
        );
      });

  // Load resources initially
  // TODO: Ideally we dispatch the requests on first render and not after first render. State
  // updates can happen after first render, but for now that is difficult to differentiate between
  // dispatching requests and updating states.
  if (!isSSR && meta.phase === 'MOUNTING') {
    Object.entries(config.loaders).forEach(([key, loader]) => {
      meta.queue.push(() => {
        const load = createLoad(key);
        loader.request({ load, cache }, store.dispatch);
      });
    });

    if (hasCodeSplit) {
      meta.queue.push(() => {
        const load = createLoad('bundle');
        load(component.bundle());
      });
    }
  }

  // Reload resources based on shouldReload
  const handleReload = (props) => {
    if (meta.phase !== 'MOUNTED') {
      return false;
    }

    return Object.entries(config.loaders).some(([key, loader]) => {
      const shouldReload = loader.shouldReload(
        { info: state[key], cache },
        props,
        store.getState(),
      );

      if (!shouldReload) {
        return false;
      }

      meta.queue.push(() => {
        setState(
          updateState(key, {
            startTime: getTimestamp(),
            endTime: null,
            loading: true,
            error: null,
          }),
        );

        const load = createLoad(key);
        loader.request({ load, cache }, store.dispatch);
      });

      return true;
    });
  };

  useEffect(() => {
    meta.queue.forEach((execute) => {
      execute();
    });

    meta.queue = [];
  });

  const resolveComponent = (props) => {
    const stateValues = Object.values(state);

    const loading = stateValues.some((value) => value.loading);

    if (loading || handleReload(props)) {
      return options.async.loading;
    }

    const error = stateValues.some((value) => value.error);

    if (error) {
      return options.async.error;
    }

    return meta.component;
  };

  return (props) => {
    const loaderProps = {};

    Object.entries(config.loaders).forEach(([key, loader]) => {
      const load = () => {
        if (state[key].loading) {
          const name = component.displayName || component.name || 'Component';

          // eslint-disable-next-line no-console
          console.error(`Resource ${name} ${key} is already loading.`);
        }

        return createLoad(key);
      };

      loaderProps[key] = {
        ...state[key],
        ...loader.props({ load, cache }, store.dispatch),
      };
    });

    const Component = resolveComponent(props);

    if (!connected) {
      return createElement(Component, {
        ...loaderProps,
        ...props,
      });
    }

    return createElement(Component, {
      selectors: config.selectors,
      actions: config.actions,
      props: {
        ...loaderProps,
        ...props,
      },
    });
  };
}
