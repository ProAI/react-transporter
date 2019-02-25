export default function applyOptimisticDelete(actionId, data) {
  return {
    optimistic: {
      type: 'DELETE',
      id: actionId,
      data,
    },
  };
}
