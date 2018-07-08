export default function createQuery(schema, options) {
  return {
    type: 'TRANSPORTER_QUERY',
    schema,
    ...options,
  };
}
