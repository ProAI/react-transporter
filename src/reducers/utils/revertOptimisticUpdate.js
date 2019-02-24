import getPosition from './getPosition';

export default function revertOptimisticUpdate(
  actionId,
  actionData,
  actionOptimisticData,
  data,
  optimistic,
) {
  const state = {
    data,
    optimistic,
  };

  Object.keys(actionOptimisticData).forEach(field => {
    // get position of optimistic value
    const position = getPosition(actionId, state.optimistic.data[field].values);

    // remove whole object if actual optimistic value is the only one
    if (state.optimistic.data[field].values.length === 1) {
      delete state.optimistic.data[field];

      return;
    }

    // case 1) not last position, response value present
    if (
      position !== state.optimistic.data[field].values.length - 1 &&
      actionData[field] !== undefined
    ) {
      // update original value
      state.optimistic.data[field].originalValue = actionData[field];

      // deprecate previous values
      state.optimistic.data[field].values.map((value, key) =>
        key < position ? { ...value, active: false } : value,
      );
    }

    // case 2) last position, response value present
    if (
      position === state.optimistic.data[field].values.length - 1 &&
      actionData[field] !== undefined
    ) {
      // use response value
      state.data[field] = actionData[field];

      // delete original value
      delete state.optimistic.data[field].originalValue; // TODO

      // deprecate previous values
      state.optimistic.data[field].values.map((value, key) =>
        key < position ? { ...value, active: false } : value,
      );
    }

    // case 3) not last position, no response value
    // do nothing

    // case 4) last position, no response value
    if (
      position === state.optimistic.data[field].values.length - 1 &&
      actionData[field] === undefined
    ) {
      // revert to original value or previous optimistic value
      if (position === 0) {
        const { originalValue } = optimistic.data[field];

        if (originalValue !== undefined) {
          state.data[field] = originalValue;
        } else {
          delete state.data[field];
        }
      } else {
        state.data[field] = optimistic.data[field].values[position - 1];
      }
    }

    // delete actual optimistic value
    state.optimistic.data[field].values.splice(position, 1);
  });

  if (Object.keys(state.optimistic.data).length === 0) {
    state.optimistic = null;
  }

  return state;
}
