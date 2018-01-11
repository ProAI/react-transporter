export default function addOptimisticUpdate(state, action, getField, isRoot = false) {
  const dataType = isRoot ? 'roots' : 'entities';
  const optimistic = { ...getField(state.optimsitic.updates) };
  const value = {
    active: true,
    id: action.id,
    value: getField(action.optimisticData[dataType]),
  };

  if (optimistic) {
    optimistic.values.push(value);
    return optimistic;
  }

  return {
    originalValue: getField(state.data),
    values: [value],
  };
}
