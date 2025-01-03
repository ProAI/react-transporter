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
      );
    }

    if (selection.kind === 'InlineFragment') {
      try {
        Object.assign(
          result,
          handleSelectionSet(selection.selectionSet, value, context),
        );
      } catch (err) {
        if (err.name !== 'ValueError') {
          throw err;
        }

        if (selection.typeCondition.name.value === value[TYPENAME]) {
          throw new Error(
            `Inline fragment "${selection.typeCondition.name.value}" has an undefined value and has been skipped.`,
          );
        }

        // Hint: If type condition is not typename, do not throw an error.
      }
    }

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
          throw new Error(
            `Fragment "${fragmentAst.name.value}" has an undefined value and has been skipped.`,
          );
        }

        // Hint: If type condition is not typename, do not throw an error.
      }
    }
  });

  return result;
};

const buildNode = (selectionSet, value, context) => {
  // Return value if there is no selection set
  if (selectionSet === undefined) {
    return value;
  }

  // Handle array of values
  if (Array.isArray(value)) {
    // eslint-disable-next-line no-use-before-define
    return value.map((v) => handleValue(selectionSet, v, context));
  }

  // Handle value
  // eslint-disable-next-line no-use-before-define
  return handleValue(selectionSet, value, context);
};

const handleRef = (selectionSet, ref, context) => {
  if (ref === null) {
    return null;
  }

  const { cache, handleEntity } = context;

  const [type, id] = ref;
  const cachedEntity = cache.data.get(type, id);

  if (!cachedEntity) {
    throw new ValueError(`Entity [${type}, ${id}] not found.`);
  }

  const result = handleSelectionSet(selectionSet, cachedEntity, context);

  return handleEntity(type, id, result);
};

const handleValue = (selectionSet, value, context) => {
  if (value === undefined) {
    throw new ValueError('Undefined value.');
  }

  if (value === null) {
    return null;
  }

  if (!(REF_KEY in value)) {
    return handleSelectionSet(selectionSet, value, context);
  }

  const ref = value[REF_KEY];
  const { handleLink } = context;

  // TODO: Apply connections
  // const entity = handleConnection(ref ? data.get(...ref) : value);

  if (ref.length === 2 && !Array.isArray(ref[0])) {
    return handleLink(handleRef(selectionSet, ref, context));
  }

  return handleLink(
    ref.map((refItem) => handleRef(selectionSet, refItem, context)),
  );
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
      queryAst.operation === 'mutation',
    );
  } catch (err) {
    if (err.name !== 'ValueError') {
      throw err;
    } else {
      throw new Error(
        `Query "${queryAst.name.value}" has an undefined value and has been skipped.`,
      );
    }
  }
}
