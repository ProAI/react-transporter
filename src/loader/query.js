function createQuery(schema, options) {
  return {
    type: 'TRANSPORTER_QUERY',
    schema,
    ...options,
  };
}

export default function query(schema, options) {
  let timeout = null;

  return {
    init: load => load(createQuery(schema, options), { isReduxThunkAction: true }),
    props: load => ({
      refetch: (...localOptions) =>
        load(createQuery(schema, { ...options, ...localOptions }), { isReduxThunkAction: true }),
      fetchMore: (...localOptions) =>
        load(createQuery(schema, { ...options, ...localOptions }), {
          isReduxThunkAction: true,
          blocking: false,
        }),
      startPolling: (interval) => {
        timeout = setInterval(() => {
          load(createQuery(schema, options), { isReduxThunkAction: true, blocking: false });
        }, interval);
      },
      endPolling: () => {
        clearInterval(timeout);
      },
    }),
  };
}
