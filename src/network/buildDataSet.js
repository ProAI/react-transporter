import { valueFromASTUntyped } from 'graphql/utilities/valueFromASTUntyped';
import { TYPENAME, ID, REF_KEY } from '../constants';
import makeAttributeKeyWithArgs from './makeAttributeKeyWithArgs';
import DataSet from './DataSet';

const getKey = (field, variables) => {
  const name = field.name.value;

  if (field.arguments.length === 0) {
    return name;
  }

  const args = {};

  field.arguments.forEach((arg) => {
    args[arg.name.value] = valueFromASTUntyped(arg.value, variables);
  });

  return makeAttributeKeyWithArgs(name, args);
};

const handleSelectionSet = (selectionSet, value, cache, data) => {
  const { ast, options } = cache.request;

  const result = {};

  selectionSet.selections.forEach((selection) => {
    if (selection.kind === 'Field') {
      const key = getKey(selection, options.variables);

      // eslint-disable-next-line no-use-before-define
      result[key] = buildNode(selection.selectionSet, value[key], cache, data);
    }

    if (selection.kind === 'InlineFragment') {
      console.log('TODO: inline fragment', selection);
    }

    if (selection.kind === 'FragmentSpread') {
      const fragmentAst = ast.definitions.find(
        (def) =>
          def.kind === 'FragmentDefinition' &&
          def.name.value === selection.name.value,
      );

      const fragmentResult = handleSelectionSet(
        fragmentAst.selectionSet,
        value,
        cache,
        data,
      );

      Object.assign(result, fragmentResult);
    }
  });

  return result;
};

const buildNode = (selectionSet, value, cache, data) => {
  // Return value if there is no selection set
  if (selectionSet === undefined) {
    return value;
  }

  // Handle array value
  if (Array.isArray(value)) {
    // eslint-disable-next-line no-use-before-define
    return value.map((v) => handleValue(selectionSet, v, cache, data));
  }

  // Handle value
  // eslint-disable-next-line no-use-before-define
  return handleValue(selectionSet, value, cache, data);
};

const handleValue = (selectionSet, value, cache, data) => {
  // TODO: Apply connections
  // const entity = handleConnection(ref ? data.get(...ref) : value);

  if (value === null) {
    return null;
  }

  const ref = value[REF_KEY];

  if (!ref) {
    return handleSelectionSet(selectionSet, value, cache, data);
  }

  const [type, id] = ref;
  const cachedEntity = cache.data.get(type, id);

  const entity = handleSelectionSet(selectionSet, cachedEntity, cache, data);

  data.add({
    entities: {
      [TYPENAME]: {
        [ID]: entity,
      },
    },
  });

  return value;
};

export default function buildDataSet(cache) {
  const { ast } = cache.request;

  const queryAst = ast.definitions.find(
    (def) => def.kind === 'OperationDefinition',
  );
  const cachedRoots = cache.data.getRoots();

  const data = new DataSet();

  const roots = handleSelectionSet(
    queryAst.selectionSet,
    cachedRoots,
    cache,
    data,
  );

  data.add({ roots });

  return data;
}
