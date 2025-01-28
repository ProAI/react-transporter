import { useContext, useState, useRef } from 'react';
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

  const [state, setState] = useState({
    ok: null,
    loading: false,
    executed: false,
    error: null,
  });

  const instances = useRef([]);

  const updateState = (instance) => {
    const latestInstance = getLatestInstance(instances);

    if (latestInstance !== instance) {
      return;
    }

    const { status } = instance.resource;

    setState({
      ok: status === PENDING ? null : status === FULFILLED,
      loading: status === PENDING,
      executed: status === FULFILLED || status === REJECTED,
      error: status !== REJECTED ? null : instance.resource.response,
    });
  };

  const dispatch = (ast, options) => {
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

    updateState(instance);

    // Update state and return cached selector set.
    return instance.resource.promise.then(
      () => {
        updateState(instance);
        return instance.cache.graphData.getQuery();
      },
      (err) => {
        updateState(instance);
        throw err;
      },
    );
  };

  return [dispatch, state];
}
