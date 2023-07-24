import { valueFromASTUntyped } from 'graphql/utilities/valueFromASTUntyped';
import { TYPENAME, ID, REF_KEY } from '../constants';
import makeAttributeKeyWithArgs from './makeAttributeKeyWithArgs';
import makeSelectorKey from './makeSelectorKey';
import Selector from './Selector';

// TODO
// const handleConnection = (value, selectionSet, data) => {
//   ...
// };

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

const addSelector = (data, cache, selectors, fragment) => {
  const key = makeSelectorKey(fragment);
  const currentSelector = cache.selectors[key];

  // eslint-disable-next-line no-param-reassign
  selectors[key] = currentSelector?.isEqual(data)
    ? currentSelector
    : new Selector(data);
};

const handleSelectionSet = (selectionSet, data, cache, selectors) => {
  const { ast, options } = cache.request;

  const result = {};

  if (data[TYPENAME]) {
    result[TYPENAME] = data[TYPENAME];
  }

  if (data[ID]) {
    result[ID] = data[ID];
  }

  selectionSet.selections.forEach((selection) => {
    if (selection.kind === 'Field') {
      const key = getKey(selection, options.variables);

      // eslint-disable-next-line no-use-before-define
      result[selection.name.value] = buildNode(
        selection.selectionSet,
        data[key],
        cache,
        selectors,
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
        data,
        cache,
        selectors,
      );
      addSelector(fragmentResult, cache, selectors, {
        name: fragmentAst.name.value,
        entry: [data[TYPENAME], data[ID]],
      });
    }
  });

  return result;
};

const handleRef = (selectionSet, value, cache, selectors) => {
  // Handle null reference
  if (value === null) {
    return null;
  }

  const ref = value[REF_KEY];

  // If ref is set, get the entity from data. Otherwise assume that the entity
  // is just the value.
  const entity = ref ? cache.data.get(...ref) : value;

  // TODO: Apply connections
  // const entity = handleConnection(ref ? data.get(...ref) : value);

  if (typeof entity !== 'object') {
    throw new Error(`Entity [${ref[0]},${ref[1]}] not found.`);
  }

  return handleSelectionSet(selectionSet, entity, cache, selectors);
};

const buildNode = (selectionSet, value, cache, selectors) => {
  // Return value if there is no selection set
  if (selectionSet === undefined) {
    return value;
  }

  // Handle array of references
  if (Array.isArray(value)) {
    return value.map((v) => handleRef(selectionSet, v, cache, selectors));
  }

  // Handle reference
  return handleRef(selectionSet, value, cache, selectors);
};

export default function buildSelectors(cache) {
  const { ast } = cache.request;

  const queryAst = ast.definitions.find(
    (def) => def.kind === 'OperationDefinition',
  );
  const roots = cache.data.getRoots();

  // TODO: Use Proxy to catch undefined properties and warn the user: "The property xy is not in this query."

  const selectors = {};

  const result = handleSelectionSet(
    queryAst.selectionSet,
    roots,
    cache,
    selectors,
  );
  addSelector(result, cache, selectors);

  return selectors;
}
