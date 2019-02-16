export default function createMutation(mutation, options) {
  return {
    type: 'TRANSPORTER_MUTATION',
    mutation,
    ...options,
  };
}
