class GraphQLError extends Error {
  ast;

  errors;

  constructor(errors, ast, options) {
    if (options.createMessage) {
      super(options.createMessage(errors, ast));
    } else {
      const node = ast.definitions.find(
        (def) => def.kind === 'OperationDefinition',
      );

      const operation = node?.operation;
      const name = node?.name?.value;

      super(`Error in ${operation} ${name}`);
    }

    this.ast = ast;
    this.errors = errors;
    this.name = 'GraphQLError';
  }
}

export default GraphQLError;
