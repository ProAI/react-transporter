import isSameEntity from '../../utils/isSameEntity';

export default function filterOutOptimisticTrash(actionTrash, actionOptimisticTrash) {
  if (!actionOptimisticTrash) {
    return actionTrash;
  }

  return actionTrash.filter(link =>
    actionOptimisticTrash.some(optimisticLink => isSameEntity(link, optimisticLink)),
  );
}
