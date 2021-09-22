import { shallowEqual } from 'react-redux';
import createQuery from '../actions/createQuery';

export default function query(queryParam, allOptions = {}) {
  const { loaderOptions, ...options } = allOptions;

  return {
    request: ({ load, cache }, dispatch) => {
      cache.set('variables', options.variables);

      return loaderOptions && loaderOptions.skip
        ? load(new Promise((resolve) => resolve()))
        : load(dispatch(createQuery(queryParam, options)));
    },
    props: ({ load, cache }, dispatch) => ({
      refetch: (...localOptions) => {
        cache.set('variables', options.variables);

        return load(
          dispatch(createQuery(queryParam, { ...options, ...localOptions })),
        );
      },
      fetchMore: (...localOptions) => {
        cache.set('variables', options.variables);

        return load(
          dispatch(createQuery(queryParam, { ...options, ...localOptions }), {
            showWhileLoading: true,
          }),
        );
      },
      startPolling: (interval) => {
        const timeout = setInterval(() => {
          load(
            dispatch(createQuery(queryParam, options), {
              showWhileLoading: true,
            }),
          );
        }, interval);

        cache.set('timeout', timeout);
      },
      endPolling: () => {
        clearInterval(cache.get('timeout'));
        cache.set('timeout', null);
      },
    }),
    shouldReload: ({ info, cache }, props, state) => {
      const previousVariables = cache.get('variables');
      cache.set('variables', options.variables);

      // Reload query if reset has been triggered or variables have changed
      return (
        info.startTime < state.info.lastReset ||
        !shallowEqual(previousVariables, options.variables)
      );
    },
  };
}
