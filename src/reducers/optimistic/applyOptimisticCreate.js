export default function applyOptimisticCreate(actionId, actionOptimisticData) {
  return {
    data: actionOptimisticData,
    optimistic: {
      type: 'CREATE',
      id: actionId,
    },
  };
}
