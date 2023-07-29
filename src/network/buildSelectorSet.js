import { valueFromASTUntyped } from 'graphql/utilities/valueFromASTUntyped';
import { TYPENAME, ID, REF_KEY } from '../constants';
import makeAttributeKeyWithArgs from './makeAttributeKeyWithArgs';
import SelectorSet from './SelectorSet';

const isEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

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

const handleSelectionSet = (selectionSet, value, cache, selectorSet) => {
  const { ast, options } = cache.request;

  const result = {};

  selectionSet.selections.forEach((selection) => {
    if (selection.kind === 'Field') {
      const key = getKey(selection, options.variables);

      // eslint-disable-next-line no-use-before-define
      result[selection.name.value] = buildNode(
        selection.selectionSet,
        value[key],
        cache,
        selectorSet,
      );
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
        selectorSet,
      );

      const name = fragmentAst.name.value;
      const entry = [value[TYPENAME], value[ID]];

      const prevFragmentResult = cache.selectorSet?.getFragment(name, entry);

      selectorSet.setFragment(
        name,
        entry,
        isEqual(fragmentResult, prevFragmentResult)
          ? prevFragmentResult
          : fragmentResult,
      );
    }
  });

  return result;
};

const buildNode = (selectionSet, value, cache, selectorSet) => {
  // Return value if there is no selection set
  if (selectionSet === undefined) {
    return value;
  }

  // Handle array of values
  if (Array.isArray(value)) {
    // eslint-disable-next-line no-use-before-define
    return value.map((v) => handleValue(selectionSet, v, cache, selectorSet));
  }

  // Handle value
  // eslint-disable-next-line no-use-before-define
  return handleValue(selectionSet, value, cache, selectorSet);
};

const handleValue = (selectionSet, value, cache, selectorSet) => {
  // TODO: Apply connections
  // const entity = handleConnection(ref ? data.get(...ref) : value);

  if (value === null) {
    return null;
  }

  const ref = value[REF_KEY];

  if (!ref) {
    return handleSelectionSet(selectionSet, value, cache, selectorSet);
  }

  const [type, id] = ref;
  const cachedEntity = cache.data.get(type, id);

  const result = handleSelectionSet(
    selectionSet,
    cachedEntity,
    cache,
    selectorSet,
  );

  return {
    [TYPENAME]: type,
    [ID]: id,
    ...result,
  };
};

export default function buildSelectorSet(cache) {
  const { ast } = cache.request;

  const queryAst = ast.definitions.find(
    (def) => def.kind === 'OperationDefinition',
  );
  const cachedRoots = cache.data.getRoots();

  // TODO: Use Proxy to catch undefined properties and warn the user: "The property xy is not in this query."

  const selectorSet = new SelectorSet();

  const result = handleSelectionSet(
    queryAst.selectionSet,
    cachedRoots,
    cache,
    selectorSet,
  );

  const prevResult = cache.selectorSet?.getQuery();

  selectorSet.setQuery(isEqual(result, prevResult) ? prevResult : result);

  return selectorSet;
}
