export default function createQuery(query, options) {
  return {
    type: 'TRANSPORTER_QUERY',
    query,
    ...options,
  };
}
