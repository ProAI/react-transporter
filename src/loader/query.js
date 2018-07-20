import createQuery from '../actions/createQuery';

export default function query(schema, allOptions = {}) {
  const { loaderOptions, ...options } = allOptions;
  const schemaBody = schema.loc.source.body;

  return {
    request: ({ load }, dispatch) =>
      (loaderOptions && loaderOptions.skip
        ? load(new Promise(resolve => resolve()))
        : load(dispatch(createQuery(schemaBody, options)))),
    props: ({ load, cache }, dispatch) => ({
      refetch: (...localOptions) =>
        load(dispatch(createQuery(schemaBody, { ...options, ...localOptions }))),
      fetchMore: (...localOptions) =>
        load(dispatch(createQuery(schemaBody, { ...options, ...localOptions }), {
          showWhileLoading: true,
        })),
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

      return (
        info.startTime < state.transporter.info.lastReset || previousVariables === options.variables
      );
    },
  };
}
