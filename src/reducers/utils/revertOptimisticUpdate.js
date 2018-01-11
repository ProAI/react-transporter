export default function revertOptimisticUpdate(position, state, action, getField, isRoot = false) {
  const dataType = isRoot ? 'roots' : 'entities';
  const optimistic = { ...getField(state.optimsitic.updates) };
  const responseValue =
    action.data && action.data[dataType] ? getField(action.data[dataType]) : undefined;

  // remove whole object if actual optimistic value is the only one
  if (optimistic.values.length === 1) {
    return undefined;
  }

  // case 1) not last position, response value present
  if (position !== optimistic.values.length - 1 && responseValue !== undefined) {
    // update original value
    optimistic.originalValue = responseValue;

    // deprecate previous values
    optimistic.values.map((value, key) => (key < position ? { ...value, active: false } : value));
  }

  // case 2) last position, response value present
  if (position === optimistic.values.length - 1 && responseValue !== undefined) {
    // delete original value
    delete optimistic.originalValue;

    // deprecate previous values
    optimistic.values.map((value, key) => (key < position ? { ...value, active: false } : value));
  }

  // case 3) not last position, no response value
  // do nothing

  // case 4) last position, no response value
  // do nothing

  // delete actual optimistic value
  optimistic.values.splice(position, 1);

  return optimistic;
}
