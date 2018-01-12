export default function updateValueBeforeRevertingOptimisticUpdate(
  position,
  state,
  action,
  getField,
) {
  const optimistic = getField(state.optimistic.updates);
  const responseValue =
    action.data && action.data.entities ? getField(action.data.entities) : undefined;

  // case 1) not last position, response value present
  // do nothing

  // case 2) last position, response value present
  if (position === optimistic.values.length - 1 && responseValue !== undefined) {
    // use response value
    return responseValue;
  }

  // case 3) not last position, no response value
  // do nothing

  // case 4) last position, no response value
  if (position === optimistic.values.length - 1 && responseValue !== undefined) {
    // revert to original value or previous optimistic value
    return position === 0 ? optimistic.originalValue : optimistic.values[position - 1];
  }

  // nothing changed, return old value
  return getField(state.data);
}
