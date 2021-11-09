import { useEffect, useMemo } from 'react';
import useStore from './useStore';
import getTimestamp from '../../utils/getTimestamp';
import useForceUpdate from './useForceUpdate';

const isSSR = typeof window === 'undefined';

const createCache = () => {
  const cache = {};

  return {
    get: (key) => cache[key],
    set: (key, value) => {
      cache[key] = value;
    },
  };
};

const resolveES6 = (x) =>
  x != null && (typeof x === 'function' || typeof x === 'object') && x.default
    ? x.default
    : x;

const updateLoaderState = (state, key, data) => ({
  ...state.loaders[key],
  ...data,
});

const refreshStatusState = (state) => {
  const loaderValues = Object.values(state.loaders);

  if (loaderValues.some((value) => value.loading)) {
    return 'LOADING';
  }

  if (loaderValues.some((value) => !!value.error)) {
    return 'ERROR';
  }

  return 'RESOLVED';
};

export default function useLoaders(component, config) {
  const store = useStore();
  const forceUpdate = useForceUpdate();

  const hasCodeSplit = !!(component.name && component.bundle);

  const state = useMemo(() => {
    const initialState = {
      status: 'LOADING',
      phase: 'MOUNTING',
      component: !hasCodeSplit ? component : null,
      loaders: {},
      queue: [],
    };

    const loaderTimes = {
      startTime: getTimestamp(),
      endTime: null,
    };

    if (hasCodeSplit) {
      initialState.loaders.bundle = {
        ...loaderTimes,
        cache: null,
        loading: hasCodeSplit,
        error: null,
      };
    }

    Object.keys(config.loaders).forEach((key) => {
      initialState.loaders[key] = {
        ...loaderTimes,
        cache: createCache(),
        loading: true,
        error: null,
      };
    });

    return initialState;
  }, []);

  // useEffect will be called after rendering, so that we can add updates to
  // queue while rendering and execute them in useEffect.
  useEffect(() => {
    state.phase = 'MOUNTED';

    state.queue.forEach((execute) => {
      execute();
    });

    state.queue = [];

    return () => {
      state.phase = 'UNMOUNTED';
    };
  });

  const createLoad = (key) => (promise) =>
    promise
      .then((result) => {
        if (state.phase === 'UNMOUNTED') {
          return;
        }

        // Save component if request was done for a component
        if (key === 'bundle') {
          state.component = resolveES6(result);
        }

        state.loaders[key] = updateLoaderState(state, key, {
          endTime: getTimestamp(),
          loading: false,
          error: null,
        });

        state.status = refreshStatusState(state);

        forceUpdate();
      })
      .catch((error) => {
        if (state.phase === 'UNMOUNTED') {
          return;
        }

        state.loaders[key] = updateLoaderState(state, key, {
          endTime: getTimestamp(),
          loading: false,
          error,
        });

        state.status = refreshStatusState(state);

        forceUpdate();
      });

  // Load resources initially
  // TODO: Ideally we dispatch the requests on first render and not after first render. State
  // updates can happen after first render, but for now that is difficult to differentiate between
  // dispatching requests and updating states.
  const handleInitialLoad = () => {
    if (isSSR || state.phase !== 'MOUNTING') {
      return;
    }

    Object.entries(config.loaders).forEach(([key, loader]) => {
      state.queue.push(() => {
        const load = createLoad(key);
        loader.request(
          { load, cache: state.loaders[key].cache },
          store.dispatch,
        );
      });
    });

    if (hasCodeSplit) {
      state.queue.push(() => {
        const load = createLoad('bundle');
        load(component.bundle());
      });
    }
  };

  handleInitialLoad();

  // Reload resources based on shouldReload
  const handleReload = () => {
    if (state.phase !== 'MOUNTED') {
      return;
    }

    const data = store.getState();

    Object.entries(config.loaders).forEach(([key, loader]) => {
      const shouldReload = loader.shouldReload(
        { info: state.loaders[key], cache: state.loaders[key].cache },
        data,
      );

      if (!shouldReload || state.loaders[key].loading) {
        return;
      }

      state.loaders[key] = updateLoaderState(state, key, {
        startTime: getTimestamp(),
        endTime: null,
        loading: true,
        error: null,
      });

      state.status = refreshStatusState(state);

      state.queue.push(() => {
        const load = createLoad(key);
        loader.request(
          { load, cache: state.loaders[key].cache },
          store.dispatch,
        );
      });
    });
  };

  handleReload();

  const loaderProps = {};

  Object.entries(config.loaders).forEach(([key, loader]) => {
    const load = () => {
      if (state.loaders[key].loading) {
        const name = component.displayName || component.name || 'Component';

        // eslint-disable-next-line no-console
        console.error(`Resource ${name} ${key} is already loading.`);
      }

      const reload = createLoad(key);

      // Force update, so that component is back in loading state.
      forceUpdate();

      return reload;
    };

    loaderProps[key] = {
      ...state.loaders[key],
      ...loader.getProps(
        { load, cache: state.loaders[key].cache },
        store.dispatch,
      ),
    };
  });

  return [state, loaderProps];
}
