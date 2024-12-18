import { useContext, useRef } from 'react';
import TransporterContext from './TransporterContext';

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

const getLatestInstance = ({ current: instances }) => {
  if (instances.length === 0) {
    return null;
  }

  return instances[instances.length - 1];
};

export default function useDispatcher() {
  const context = useContext(TransporterContext);

  if (!context) {
    throw new Error('Dispatcher hook is used outside of TransporterContext.');
  }

  const instances = useRef([]);

  return {
    dispatch(ast, options) {
      const operation = ast.definitions.find(
        (def) => def.kind === 'OperationDefinition',
      )?.operation;

      if (operation !== 'query' && operation !== 'mutation') {
        throw new Error(
          'No operation found. Must be either "query" or "mutation".',
        );
      }

      const instance =
        operation === 'query'
          ? context.client.query(ast, options)
          : context.client.mutate(ast, options);

      instances.current.push(instance);

      // Return cached selector set.
      return instance.resource.promise.then(() =>
        instance.cache.graphData.getQuery(),
      );
    },
    get ok() {
      const instance = getLatestInstance(instances);

      if (!instance || instance.status === PENDING) {
        return null;
      }

      return instance.status === FULFILLED;
    },
    get loading() {
      const instance = getLatestInstance(instances);

      if (!instance) {
        return false;
      }

      return instance.status === PENDING;
    },
    get executed() {
      const instance = getLatestInstance(instances);

      if (!instance) {
        return false;
      }

      return instance.status === FULFILLED || instance.status === REJECTED;
    },
    get error() {
      const instance = getLatestInstance(instances);

      if (!instance || instance.status !== REJECTED) {
        return null;
      }

      return instance.response;
    },
  };
}
