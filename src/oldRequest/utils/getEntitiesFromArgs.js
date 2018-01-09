import hasManyEntities from '../../utils/hasManyEntities';

export default function getEntitiesFromArgs(args) {
  if (args.length === 0) {
    return null;
  }

  if (args.length === 2 && !hasManyEntities(args[0])) {
    if (typeof args[1] !== 'object') {
      // case 1) only one entity
      return [args];
    }

    // case 2) multiple ids of one entity type
    return args[1].map(id => [args[0], id]);
  }

  // case 3) array of getEntities
  return args;
}
