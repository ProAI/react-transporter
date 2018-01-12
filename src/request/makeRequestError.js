export default function makeRequestError(error, v) {
  const prefix = 'Request Error:';

  switch (error) {
    // store errors
    case 'EXISTING_ENTITY_INSERT':
      return `${prefix} [Failed to insert entity] Entity [${v.type}, ${v.id}] already exists.`;
    case 'MISSING_ENTITY_UPDATE':
      return `${prefix} [Failed to update entity] Entity [${v.type}, ${v.id}] does not exist.`;
    case 'MISSING_ENTITY_DELETE':
      return `${prefix} [Failed to delete entity] Entity [${v.type}, ${v.id}] does not exist.`;
    // entity field errors
    case 'WRONG_CONNECTION_FIELD_VALUE':
      return `${prefix} [Failed to set field] Field '${v.name}' of entity [${v.type}, ${
        v.id
      }] has a connection value, scalar value given.`;
    case 'WRONG_SCALAR_FIELD_VALUE':
      return `${prefix} [Failed to set field] Field '${v.name}' of entity [${v.type}, ${
        v.id
      }] has a scalar value, connection value given.`;
    case 'WRONG_CONNECTION_MANYLINK_FIELD_VALUE':
      return `${prefix} [Failed to set field] Field '${v.name}' of entity [${v.type}, ${
        v.id
      }] is of type ManyLink, not Link.`;
    case 'WRONG_CONNECTION_LINK_FIELD_VALUE':
      return `${prefix} [Failed to set field] Field '${v.name}' of entity [${v.type}, ${
        v.id
      }] is of type Link, not ManyLink.`;
    case 'MISSING_FIELD':
      return `${prefix} [Failed to get field] Field '${v.name}' of entity [${v.type}, ${
        v.id
      }] does not exist.`;
    // root field errors
    case 'WRONG_ROOT_VALUE':
      return `${prefix} [Failed to set root] Root '${v.name}' must have a connection value.`;
    case 'WRONG_ROOT_MANYLINK_VALUE':
      return `${prefix} [Failed to set root] Root '${v.name}' is of type ManyLink, not Link.`;
    case 'WRONG_ROOT_LINK_VALUE':
      return `${prefix} [Failed to set root] Root '${v.name}' is of type Link, not ManyLink.`;
    default:
      return `${prefix} Unknown request error.`;
  }
}
