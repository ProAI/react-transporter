export default class RequestError extends Error {
  constructor(error, variables) {
    super(error);

    this.error = error;
    this.variables = variables;
  }

  getMessage() {
    const v = this.variables;

    switch (this.error) {
      case 'MISSING_ENTITY':
        return `Selected entity [${v.type}, ${v.id}] not found.`;
      case 'MISSING_ROOT':
        return `Selected root '${v.name}' not found.`;
      case 'MISSING_RELATION':
        return `Selected relation '${v.name}' of entity [${v.type}, ${v.id}] not found.`;
      case 'MISSING_JOINED_ENTITY':
        return `Joined entity [${v.type}, ${v.id}] not found.`;
      case 'MISSING_JOINED_RELATION':
        return `Joined relation '${v.name}' of entity [${v.type}, ${v.id}] not found.`;
      case 'UNKNOWN_WHERE_OPERATOR':
        return `Unknown operator '${v.operator}'`;
      default:
        return 'Unknown selector error.';
    }
  }
}
