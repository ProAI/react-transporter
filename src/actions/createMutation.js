export default function createMutation(schema, options) {
  return {
    type: 'TRANSPORTER_MUTATION',
    schema,
    ...options,
  };
}
