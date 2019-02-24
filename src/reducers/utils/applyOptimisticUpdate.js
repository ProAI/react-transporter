export default function applyOptimisticUpdate(actionId, actionOptimisticData, data, optimistic) {
  const state = {
    data,
    optimistic: optimistic || {
      type: 'UPDATE',
      data: {},
    },
  };

  Object.keys(actionOptimisticData).forEach(field => {
    state.data[field] = actionOptimisticData[field];

    if (!state.optimistic.data[field]) {
      state.optimistic.data[field] = {
        originalValue: state.data[field],
        values: [],
      };
    }

    state.optimistic.data[field].values.push({
      active: true,
      id: actionId,
      value: actionOptimisticData[field],
    });
  });

  return state;
}
