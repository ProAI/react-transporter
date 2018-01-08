export function throwSelectRootError(name) {
  throw new Error(`Cannot find root '${name}'.`);
}

export function throwSelectEntityError(type, id) {
  throw new Error(`Cannot find entity [${type}, ${id}].`);
}

export function logSelectRelationWarning(type, id, name) {
  // eslint-disable-next-line no-console
  console.error(`Warning: Relation "${name}" of entity [${type}, ${id}] not found.`);
}

export function logSelectLinkedEntityWarning(type, id) {
  // eslint-disable-next-line no-console
  console.error(`Warning: Cannot find linked entity [${type}, ${id}]`);
}
