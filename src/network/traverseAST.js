import { valueFromASTUntyped } from 'graphql/utilities/valueFromASTUntyped';
import { REF_KEY, TYPENAME, ID } from '../constants';
import makeKey from '../key';
import ValueError from '../errors/ValueError';

const getKey = (field, variables, ignoreArgs) => {
  const name = field.name.value;

  if (field.arguments.length === 0 || ignoreArgs) {
    return name;
  }

  const args = {};

  field.arguments.forEach((arg) => {
    args[arg.name.value] = valueFromASTUntyped(arg.value, variables);
  });

  return makeKey(name, args);
};

const handleSelectionSet = (
  selectionSet,
  value,
  context,
  path = [],
  ignoreArgs = false,
) => {
  const { cache, handleFragment, keyWithArgs } = context;
  const { ast, options } = cache.request;

  const result = {};

  selectionSet.selections.forEach((selection) => {
    if (selection.kind === 'Field') {
      const key = getKey(selection, options.variables, ignoreArgs);

      const resultKey = keyWithArgs ? key : selection.name.value;

      // eslint-disable-next-line no-use-before-define
      result[resultKey] = buildNode(
        selection.selectionSet,
        value[key],
        context,
        [...path, resultKey],
      );
    }

    // Include inline fragment if type condition is fullfilled.
    if (
      selection.kind === 'InlineFragment' &&
      selection.typeCondition.name.value === value[TYPENAME]
    ) {
      try {
        Object.assign(
          result,
          handleSelectionSet(selection.selectionSet, value, context, path),
        );
      } catch (err) {
        if (err.name !== 'ValueError') {
          throw err;
        }

        throw new Error(
          `Inline fragment "${selection.typeCondition.name.value}" has an undefined value and has been skipped.`,
        );
      }
    }

    // Include fragment and try to guess if type condition is fullfilled.
    if (selection.kind === 'FragmentSpread') {
      const fragmentAst = ast.definitions.find(
        (def) =>
          def.kind === 'FragmentDefinition' &&
          def.name.value === selection.name.value,
      );

      try {
        const fragmentResult = handleSelectionSet(
          fragmentAst.selectionSet,
          value,
          context,
        );

        Object.assign(
          result,
          handleFragment(
            fragmentAst.name.value,
            value[TYPENAME],
            value[ID],
            fragmentResult,
          ),
        );
      } catch (err) {
        if (err.name !== 'ValueError') {
          throw err;
        }

        if (fragmentAst.typeCondition.name.value === value[TYPENAME]) {
          const errPath = err.path.join('.');

          throw new Error(
            `Fragment "${fragmentAst.name.value}" at [${errPath}]: ${err.message}`,
          );
        }

        // TODO: Add mapping between interface and type names!
        // Hint: If type condition is not typename, do not throw an error.
      }
    }
  });

  return result;
};

const buildNode = (selectionSet, value, context, path) => {
  // Return value if there is no selection set
  if (selectionSet === undefined) {
    return value;
  }

  // Handle array of values
  if (Array.isArray(value)) {
    return value.map((v, k) =>
      // eslint-disable-next-line no-use-before-define
      handleValue(selectionSet, v, context, [...path, k]),
    );
  }

  // Handle value
  // eslint-disable-next-line no-use-before-define
  return handleValue(selectionSet, value, context, path);
};

const handleRef = (selectionSet, ref, context, path) => {
  if (ref === null) {
    return null;
  }

  const { cache, handleEntity } = context;

  const [type, id] = ref;
  const cachedEntity = cache.data.get(type, id);

  if (!cachedEntity) {
    throw new ValueError(`Entity [${type}, ${id}] not found.`, path);
  }

  const result = handleSelectionSet(selectionSet, cachedEntity, context, path);

  return handleEntity(type, id, result);
};

const handleValue = (selectionSet, value, context, path) => {
  if (value === undefined) {
    throw new ValueError('Undefined value.', path);
  }

  if (value === null) {
    return null;
  }

  if (!(REF_KEY in value)) {
    return handleSelectionSet(selectionSet, value, context, path);
  }

  const { handleLink } = context;

  // TODO: Apply connections
  // const entity = handleConnection(value[REF_KEY] ? data.get(...value[REF_KEY]) : value);

  return handleLink(handleRef(selectionSet, value[REF_KEY], context, path));
};

export default function traverseAST(
  cache,
  { handleFragment, handleEntity, handleLink, keyWithArgs = false },
) {
  const { ast } = cache.request;

  const queryAst = ast.definitions.find(
    (def) => def.kind === 'OperationDefinition',
  );
  const cachedRoots = cache.data.getRoots();

  const context = {
    cache,
    handleFragment,
    handleEntity,
    handleLink,
    keyWithArgs,
  };

  try {
    return handleSelectionSet(
      queryAst.selectionSet,
      cachedRoots,
      context,
      [],
      queryAst.operation === 'mutation',
    );
  } catch (err) {
    if (err.name !== 'ValueError') {
      throw err;
    } else {
      const { path, message } = err;
      const errPath = path.join('.');

      throw new Error(
        `Query "${queryAst.name.value}" at [${errPath}]: ${message}`,
      );
    }
  }
}
