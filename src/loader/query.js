import createQuery from '../actions/createQuery';

const compareVariables = (a, b) => {
  if ((a && !b) || (!a && b)) {
    return false;
  }

  if (a && b) {
    if (Object.keys(a).some(key => !b[key] || a[key] !== b[key])) {
      return false;
    }

    if (Object.keys(b).some(key => !a[key] || a[key] !== b[key])) {
      return false;
    }
  }

  return true;
};

export default function query(schema, allOptions = {}) {
  const { loaderOptions, ...options } = allOptions;
  const schemaBody = schema.loc.source.body;

  return {
    request: ({ load, cache }, dispatch) => {
      cache.set('variables', options.variables);

      return loaderOptions && loaderOptions.skip
        ? load(new Promise(resolve => resolve()))
        : load(dispatch(createQuery(schemaBody, options)));
    },
    props: ({ load, cache }, dispatch) => ({
      refetch: (...localOptions) => {
        cache.set('variables', options.variables);

        return load(dispatch(createQuery(schemaBody, { ...options, ...localOptions })));
      },
      fetchMore: (...localOptions) => {
        cache.set('variables', options.variables);

        return load(dispatch(createQuery(schemaBody, { ...options, ...localOptions }), {
          showWhileLoading: true,
        }));
      },
      startPolling: (interval) => {
        const timeout = setInterval(() => {
          load(dispatch(createQuery(schemaBody, options), {
            showWhileLoading: true,
          }));
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
        info.startTime < state.transporter.info.lastReset ||
        !compareVariables(previousVariables, options.variables)
      );
    },
  };
}
