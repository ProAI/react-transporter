class GraphQLError extends Error {
  data;

  constructor(data) {
    super('GraphQL response error.');

    this.data = data;
    this.name = 'GraphQLError';
  }
}

export default GraphQLError;
