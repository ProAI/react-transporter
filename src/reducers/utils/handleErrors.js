export function throwInsertEntityError(type, id) {
  throw new Error(`Failed to insert entity: Entity [${type}, ${id}] already exists.`);
}

export function throwUpdateEntityError(type, id) {
  throw new Error(`Failed to update entity: Entity [${type}, ${id}] does not exist.`);
}

export function throwDeleteEntityError(type, id) {
  throw new Error(`Failed to delete entity: Entity [${type}, ${id}] does not exist.`);
}

export function throwUpdateConnectionError(type, id, name) {
  throw new Error(`Failed to update relation: Entity [${type}, ${id}] of relation '${name}' does not exist.`);
}

export function throwWrongConnectionFormatError(type, id, name) {
  throw new Error(`Failed to update relation: Relation '${name}' of entity [${type}, ${
    id
  }] is a many connection, use syncPrepend(), syncAppend(), prepend(), append() or detach().`);
}

export function throwWrongManyConnectionFormatError(type, id, name) {
  throw new Error(`Failed to update relation: Relation '${name}' of entity [${id[0]}, ${
    id[1]
  }] is NOT a many connection, use link() or unlink().`);
}

export function throwUpdateRootConnectionError(name) {
  throw new Error(`Failed to update root: Root '${name}' does not exist.`);
}

export function throwWrongRootConnectionFormatError(name) {
  throw new Error(`Failed to update root: Root '${
    name
  }' is a many connection, use syncPrepend(), syncAppend(), prepend(), append() or detach().`);
}

export function throwWrongManyRootConnectionFormatError(name) {
  throw new Error(`Failed to update root: Root '${name}' is NOT a many connection, use link() or unlink().`);
}
