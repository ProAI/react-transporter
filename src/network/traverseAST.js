import { valueFromASTUntyped } from 'graphql/utilities/valueFromASTUntyped';
import { REF_KEY, TYPENAME, ID } from '../constants';
import makeAttributeKeyWithArgs from './makeAttributeKeyWithArgs';
import ValueError from './ValueError';

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

const handleSelectionSet = (selectionSet, value, context) => {
  const { cache, handleFragment } = context;
  const { ast, options } = cache.request;

  const result = {};

  selectionSet.selections.forEach((selection) => {
    if (selection.kind === 'Field') {
      const key = getKey(selection, options.variables);

      // eslint-disable-next-line no-use-before-define
      result[selection.name.value] = buildNode(
        selection.selectionSet,
        value[key],
        context,
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
        } else if (fragmentAst.typeCondition.name.value === value[TYPENAME]) {
          throw new Error(
            `Fragment "${fragmentAst.name.value}" has an undefined value and has been skipped.`,
          );
        }
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

const handleValue = (selectionSet, value, context) => {
  if (value === undefined) {
    throw new ValueError();
  }

  // TODO: Apply connections
  // const entity = handleConnection(ref ? data.get(...ref) : value);

  if (value === null) {
    return null;
  }

  const ref = value[REF_KEY];

  if (!ref) {
    return handleSelectionSet(selectionSet, value, context);
  }

  const { cache, handleEntity } = context;

  const [type, id] = ref;
  const cachedEntity = cache.data.get(type, id);

  const result = handleSelectionSet(selectionSet, cachedEntity, context);

  return handleEntity(type, id, result);
};

export default function traverseAST(cache, handleFragment, handleEntity) {
  const { ast } = cache.request;

  const queryAst = ast.definitions.find(
    (def) => def.kind === 'OperationDefinition',
  );
  const cachedRoots = cache.data.getRoots();

  const context = {
    cache,
    handleFragment,
    handleEntity,
  };

  try {
    return handleSelectionSet(queryAst.selectionSet, cachedRoots, context);
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
