export default function makeSelectorError(error, v) {
  const prefix = 'Selector Error:';
  switch (error) {
    case 'MISSING_ENTITY':
      return `${prefix} Selected entity [${v.type}, ${v.id}] not found.`;
    case 'MISSING_ROOT':
      return `${prefix} Selected root '${v.name}' not found.`;
    case 'MISSING_RELATION':
      return `${prefix} Selected relation '${v.name}' of entity [${v.type}, ${v.id}] not found.`;
    case 'MISSING_JOINED_ENTITY':
      return `${prefix} Joined entity [${v.type}, ${v.id}] not found.`;
    case 'MISSING_JOINED_RELATION':
      return `${prefix} Joined relation '${v.name}' of entity [${v.type}, ${v.id}] not found.`;
    case 'UNKNOWN_WHERE_OPERATOR':
      return `${prefix} Unknown operator '${v.operator}'`;
    default:
      return `${prefix} Unknown selector error.`;
  }
}
