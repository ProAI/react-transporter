import GraphQLError from '../errors/GraphQLError';

export default function createRequest(client, ast, variables) {
  return client.request(ast.loc.source.body, variables).then((data) => {
    if (data.errors) {
      throw new GraphQLError(data.errors, ast, {
        createMessage: client.createGraphQLErrorMessage,
      });
    }

    return data;
  });
}
