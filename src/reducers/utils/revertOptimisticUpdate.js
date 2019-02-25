import getPosition from './getPosition';

export default function revertOptimisticUpdate(
  actionId,
  actionOptimisticData,
  actionData, // nullable
  data,
  optimistic,
) {
  const state = {
    data,
    optimistic,
  };

  Object.keys(actionOptimisticData).forEach(field => {
    const hasActionData = actionData && actionData[field] !== undefined;

    // get position of optimistic value
    const { originalValue, values } = optimistic.data[field];
    const position = getPosition(actionId, values);
    const isLastPosition = position === values.length - 1;

    /* begin set value */
    // don't revert, use response value
    if (isLastPosition && hasActionData) {
      state.data[field] = actionData[field];
    }

    // revert to original value
    if (isLastPosition && !hasActionData && values.length === 1) {
      if (originalValue === undefined) {
        delete state.data[field];
      } else {
        state.data[field] = originalValue;
      }
    }

    // revert to previous optimistic value
    if (isLastPosition && !hasActionData && values.length > 1) {
      const value = values[position - 1];

      // The value must be active, because we assume that if there is already
      // a response of a newer request, this response has the most up to date
      // value.
      if (value.active) {
        state.data[field] = value.value;
      }
    }
    /* end set value */

    /* end set optimistic */
    if (values.length === 1) {
      // remove whole object if actual optimistic value is the only one
      delete state.optimistic.data[field];
    } else {
      if (hasActionData) {
        if (!isLastPosition) {
          // update original value
          state.optimistic.data[field].originalValue = actionData[field];
        }

        // deprecate previous values
        state.optimistic.data[field].values.map((value, key) =>
          key < position ? { ...value, active: false } : value,
        );
      }

      // delete actual optimistic value
      state.optimistic.data[field].values.splice(position, 1);
    }
    /* end set optimistic */
  });

  if (Object.keys(state.optimistic.data).length === 0) {
    state.optimistic = null;
  }

  return state;
}
