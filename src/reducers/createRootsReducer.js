import getPosition from '../utils/getPosition';
import addOptimisticUpdate from './utils/addOptimisticUpdate';
import revertOptimisticUpdate from './utils/revertOptimisticUpdate';

export default function createRootsReducer(data) {
  const initialState = {
    data,
    optimistic: {},
  };

  return function reducer(state = initialState, baseAction) {
    const nextState = { ...state };
    const action = { ...baseAction };

    // TRANSPORTER_REQUEST_START
    // apply optimistic data
    if (
      action.optimisticData &&
      action.optimisticData.roots &&
      action.type === 'TRANSPORTER_REQUEST_START'
    ) {
      Object.keys(action.optimisticData.roots).forEach((root) => {
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
      action.optimisticData &&
      action.optimisticData.roots &&
      (action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
        action.type === 'TRANSPORTER_REQUEST_ERROR')
    ) {
      Object.keys(action.optimisticData.roots).forEach((root) => {
        const getRoot = object => object[root];

        // get position of optimistic value & throw error if optimistic value was not found
        const position = getPosition(action.id, getRoot(action.optimisticData.roots));
        if (position === -1) {
          throw new Error('Optimistic value not found.');
        }

        // revert optimistic value
        revertOptimisticUpdate(position, state, action, getRoot, true);

        if (action.data && action.data.roots && getRoot(action.data.roots)) {
          // delete value from response if there are newer optimsitic values
          delete action.data.roots[root];
        }
      });
    }

    // TRANSPORTER_REQUEST_COMPLETED
    // apply response data
    if (action.data.roots && action.type === 'TRANSPORTER_REQUEST_COMPLETED') {
      // add root to store
      nextState.data = Object.assign({}, nextState.data, action.data.roots);
    }

    return nextState;
  };
}
