export default function applyOptimisticDelete(actionId, data) {
  return {
    type: 'DELETE',
    id: actionId,
    data,
  };
}
