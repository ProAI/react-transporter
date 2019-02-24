export default function applyOptimisticCreate(actionId, actionOptimisticData, data) {
  const state = {
    data,
    optimistic: {
      type: 'CREATE',
      id: actionId,
    },
  };

  Object.keys(actionOptimisticData).forEach(field => {
    state.data[field] = actionOptimisticData[field];
  });

  return state;
}
