import { valueFromASTUntyped } from 'graphql/utilities/valueFromASTUntyped';
import StoreQuery from './StoreQuery';
import StoreError from '../errors/StoreError';
import getKeyName from '../utils/getKeyName';
import EntityMap from '../utils/EntityMap';

export function getData(link, constraints, entities) {
  if (link === null) {
    return null;
  }

  const store = new StoreQuery(link, entities);
  const selector = constraints ? constraints(store) : store;

  return selector.getData();
}

function getKeyNameFromAST(node, variables) {
  if (!node.arguments || node.arguments.length === 0) {
    return node.name.value;
  }

  const args = {};
  node.arguments.forEach(arg => {
    args[arg.name.value] = valueFromASTUntyped(arg.value, variables);
  });

  return [node.name.value, args];
}

function joinFromAST(selectionSet, options) {
  return query => {
    selectionSet.selections.forEach(selection => {
      if (selection.kind === 'Field' && selection.selectionSet) {
        query.join(
          getKeyNameFromAST(selection, options.variables),
          joinFromAST(selection.selectionSet, options),
        );
      }
    });

    return query;
  };
}

export default class ReadStore {
  constructor(state) {
    this.roots = state.roots.data;
    this.entities = new EntityMap(state.entities.data);
  }

  select(ast, options) {
    return options.entry
      ? this.selectByFragmentAST(ast, options)
      : this.selectByOperationAST(ast, options);
  }

  selectByFragmentAST(ast, options) {
    const fragment = ast.definitions.find(def => def.kind === 'FragmentDefinition');

    if (!fragment) {
      throw new StoreError('Option entry is set, but no fragment node found.');
    }

    return this.selectByEntity(...options.entry, joinFromAST(fragment.selectionSet, options));
  }

  selectByOperationAST(ast, options) {
    const operation = ast.definitions.find(def => def.kind === 'OperationDefinition');

    if (!operation) {
      throw new StoreError('No operation node found.');
    }

    // Get root selection.
    const selection = operation.selectionSet.selections[0];

    return this.selectByRoot(
      getKeyNameFromAST(selection, options.variables),
      joinFromAST(selection.selectionSet, options),
    );
  }

  selectByEntity(type, id, query) {
    if (!this.entities.get(type, id)) {
      throw new StoreError('Selected entity not found.', [type, id]);
    }

    return getData([type, id], query, this.entities);
  }

  selectByRoot(rawName, query) {
    const name = getKeyName(rawName);

    if (!this.roots[name]) {
      throw new StoreError(`Selected root '${name}' not found.`, 'root');
    }

    return getData(this.roots[name].link, query, this.entities);
  }

  selectByRelation(type, id, rawName, query) {
    const name = getKeyName(rawName);
    const entity = this.entities.get(type, id);

    if (!entity || !entity[name]) {
      throw new StoreError(`Selected relation '${name}' not found.`, [type, id]);
    }

    return getData(entity[name].link, query, this.entities);
  }
}
