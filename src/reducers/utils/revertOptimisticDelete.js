import isSameEntity from '../../utils/isSameEntity';

export default function revertOptimisticDelete(
  actionId,
  actionTrash,
  actionOptimisticLink,
  optimistic,
) {
  // Check if request id is correct.
  if (optimistic.id !== actionId) {
    throw new Error('Optimistic deletion was processed by other request.');
  }

  // Check if optimistic deletion is in response, too.
  if (actionTrash && actionTrash.some(link => isSameEntity(link, actionOptimisticLink))) {
    return { data: null };
  }

  // Restore entity if optimistic delete is not in response.
  return { data: optimistic.data };
}
