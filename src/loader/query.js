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
    init: load => load(createQuery(schema, options), { isReduxAction: true }),
    props: load => ({
      refetch: (...localOptions) =>
        load(createQuery(schema, { ...options, ...localOptions }), { isReduxAction: true }),
      fetchMore: (...localOptions) =>
        load(createQuery(schema, { ...options, ...localOptions }), {
          isReduxAction: true,
          blocking: false,
        }),
      startPolling: (interval) => {
        timeout = setInterval(() => {
          load(createQuery(schema, options), { isReduxAction: true, blocking: false });
        }, interval);
      },
      endPolling: () => {
        clearInterval(timeout);
      },
    }),
  };
}
