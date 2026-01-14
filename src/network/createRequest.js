import GraphQLError from '../errors/GraphQLError';

export default function createRequest(client, ast, variables) {
  const request = client
    .request(ast.loc.source.body, variables)
    .then((data) => {
      if (data.errors) {
        const node = ast.definitions.find(
          (def) => def.kind === 'OperationDefinition',
        );

        const operation = node?.operation;
        const name = node?.name?.value;

        const message = `Error in ${operation} ${name}`;

        throw new GraphQLError(message, data.errors);
      }

      return data;
    });

  if (client.formatError) {
    return request.catch((error) => {
      throw client.formatError(error);
    });
  }

  return request;
}
