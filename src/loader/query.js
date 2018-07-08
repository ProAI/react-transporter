import createQuery from '../actions/createQuery';

export default function query(schema, { skip, ...options }) {
  const schemaBody = schema.loc.source.body;
  // TODO integrate cache into (load, cache) => function
  let timeout = null;

  return {
    request: (load, dispatch) =>
      (skip
        ? load(new Promise(resolve => resolve()))
        : load(dispatch(createQuery(schemaBody, options)))),
    props: (load, dispatch) => ({
      refetch: (...localOptions) =>
        load(dispatch(createQuery(schemaBody, { ...options, ...localOptions }))),
      fetchMore: (...localOptions) =>
        load(dispatch(createQuery(schemaBody, { ...options, ...localOptions }), {
          showWhileLoading: true,
        })),
      startPolling: (interval) => {
        timeout = setInterval(() => {
          load(dispatch(createQuery(schemaBody, options), {
            showWhileLoading: true,
          }));
        }, interval);
      },
      endPolling: () => {
        clearInterval(timeout);
      },
    }),
    shouldReload: (info, props, state) => info.startTime < state.transporter.info.lastReset,
  };
}
