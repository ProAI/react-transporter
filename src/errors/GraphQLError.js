class GraphQLError extends Error {
  errors;

  constructor(message, errors) {
    super(message);

    this.errors = errors;
    this.name = 'GraphQLError';
  }
}

export default GraphQLError;
