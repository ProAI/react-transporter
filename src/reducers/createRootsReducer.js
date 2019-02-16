import getPosition from '../utils/getPosition';
import addOptimisticUpdate from './utils/addOptimisticUpdate';
import revertOptimisticUpdate from './utils/revertOptimisticUpdate';

export default function createRootsReducer(data) {
  const initialState = {
    data,
    optimistic: {
      updates: {},
      deletions: {},
    },
  };

  return function reducer(state = initialState, baseAction) {
    const nextState = JSON.parse(JSON.stringify(state));
    const action = JSON.parse(JSON.stringify(baseAction));

    // TRANSPORTER_REQUEST_START
    // apply optimistic data
    if (
      action.type === 'TRANSPORTER_REQUEST_START' &&
      action.optimisticData &&
      action.optimisticData.roots
    ) {
      Object.keys(action.optimisticData.roots).forEach(root => {
        const getRoot = object => object[root];

        // add optimistic update value
        nextState.optimistic.updates[root] = addOptimisticUpdate(nextState, action, getRoot, true);
      });

      // temporarily set stored value to optimistic value
      nextState.data = Object.assign({}, nextState.data, action.optimisticData.roots);
    }

    // TRANSPORTER_REQUEST_COMPLETED || TRANSPORTER_REQUEST_ERROR
    // revert optimistic data & apply response data for specified fields
    if (
      (action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
        action.type === 'TRANSPORTER_REQUEST_ERROR') &&
      action.optimisticData &&
      action.optimisticData.roots
    ) {
      Object.keys(action.optimisticData.roots).forEach(root => {
        const getRoot = object => object[root];

        // get position of optimistic value & throw error if optimistic value was not found
        const position = getPosition(action.id, getRoot(nextState.optimistic.updates).values);
        if (position === -1) {
          throw new Error('Optimistic value not found.');
        }

        // revert optimistic value
        nextState.optimistic.updates[root] = revertOptimisticUpdate(
          position,
          state,
          action,
          getRoot,
          true,
        );
        if (nextState.optimistic.updates[root] === undefined) {
          delete nextState.optimistic.updates[root];
        }

        // delete value from response if present
        if (action.data && action.data.roots && getRoot(action.data.roots)) {
          delete action.data.roots[root];
        }
      });
    }

    // TRANSPORTER_REQUEST_COMPLETED
    // apply response data
    if (action.type === 'TRANSPORTER_REQUEST_COMPLETED' && action.data.roots) {
      // add root to store
      nextState.data = Object.assign({}, nextState.data, action.data.roots);
    }

    if (action.type === 'TRANSPORTER_STORE_RESET') {
      return {
        data: {},
        optimistic: {
          updates: {},
          deletions: {},
        },
      };
    }

    return nextState;
  };
}
