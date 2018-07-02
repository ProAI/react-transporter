function createQuery(schema, options) {
  return {
    type: 'TRANSPORTER_QUERY',
    schema,
    ...options,
  };
}

export default function query(schema, { skip, ...options }) {
  // TODO integrate cache into (load, cache) => function
  let timeout = null;

  return {
    init: load =>
      (skip
        ? load(new Promise(resolve => resolve()))
        : load(createQuery(schema.loc.source.body, options), { isReduxThunkAction: true })),
    props: load => ({
      refetch: (...localOptions) =>
        load(createQuery(schema.loc.source.body, { ...options, ...localOptions }), {
          isReduxThunkAction: true,
        }),
      fetchMore: (...localOptions) =>
        load(createQuery(schema.loc.source.body, { ...options, ...localOptions }), {
          isReduxThunkAction: true,
          showWhileLoading: true,
        }),
      startPolling: (interval) => {
        timeout = setInterval(() => {
          load(createQuery(schema.loc.source.body, options), {
            isReduxThunkAction: true,
            showWhileLoading: true,
          });
        }, interval);
      },
      endPolling: () => {
        clearInterval(timeout);
      },
    }),
  };
}
