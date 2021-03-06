import applyOptimisticUpdate from './optimistic/applyOptimisticUpdate';
import revertOptimisticUpdate from './optimistic/revertOptimisticUpdate';
import filterOutOptimisticData from './optimistic/filterOutOptimisticData';

export default function createRootsReducer(initialData) {
  const initialState = {
    data: initialData,
    optimistic: null,
  };

  return function reducer(state = initialState, action) {
    if (action.type === 'TRANSPORTER_STORE_RESET') {
      if (!action.data || !action.data.roots) {
        return initialState;
      }

      return {
        data: action.data.roots,
        optimistic: null,
      };
    }

    // TRANSPORTER_REQUEST_START
    // Apply optimistic data from response.
    if (
      action.type === 'TRANSPORTER_REQUEST_START' &&
      action.optimisticData &&
      action.optimisticData.roots
    ) {
      // apply optimistic update
      return applyOptimisticUpdate(
        action.id,
        action.optimisticData.roots,
        state.data,
        state.optimistic,
      );
    }

    // TRANSPORTER_REQUEST_COMPLETED || TRANSPORTER_REQUEST_ERROR
    // Revert optimistic data and apply response data.
    if (
      action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
      action.type === 'TRANSPORTER_REQUEST_ERROR'
    ) {
      const nextState =
        action.optimisticData && action.optimisticData.roots
          ? revertOptimisticUpdate(
              action.id,
              action.optimisticData.roots,
              action.data && action.data.roots,
              state.data,
              state.optimistic,
            )
          : { data: { ...state.data }, optimistic: state.optimistic };

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
