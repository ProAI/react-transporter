import applyOptimisticUpdate from './utils/applyOptimisticUpdate';
import revertOptimisticUpdate from './utils/revertOptimisticUpdate';
import filterOutOptimisticData from './utils/filterOutOptimisticData';

export default function createRootsReducer(initialData) {
  const initialState = {
    data: initialData,
    optimistic: null,
  };

  return function reducer(state = initialState, action) {
    if (action.type === 'TRANSPORTER_STORE_RESET') {
      return initialState;
    }

    // TRANSPORTER_REQUEST_START
    // Apply optimistic data from response.
    if (
      action.type === 'TRANSPORTER_REQUEST_START' &&
      action.optimisticData &&
      action.optimisticData.roots
    ) {
      const nextState = JSON.parse(JSON.stringify(state));

      // apply optimistic update
      return applyOptimisticUpdate(
        action.id,
        action.optimisticData.roots,
        nextState.data,
        nextState.optimistic,
      );
    }

    // TRANSPORTER_REQUEST_COMPLETED || TRANSPORTER_REQUEST_ERROR
    // Revert optimistic data and apply response data.
    if (
      action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
      action.type === 'TRANSPORTER_REQUEST_ERROR'
    ) {
      let nextState = JSON.parse(JSON.stringify(state));

      if (action.optimisticData && action.optimisticData.roots) {
        // revert optimistic update
        nextState = revertOptimisticUpdate(
          action.id,
          action.optimisticData.roots,
          action.data && action.data.roots,
          nextState.data,
          nextState.optimistic,
        );
      }

      if (action.data && action.data.roots) {
        // Filter out fields that are also in optimistic entity
        const fields = filterOutOptimisticData(
          action.data.roots,
          action.optimisticData && action.optimisticData.roots,
        );

        fields.forEach(field => {
          nextState.data[field] = action.data.roots[field];
        });
      }

      return nextState;
    }

    return state;
  };
}
