export default function filterOutOptimisticData(actionData, actionOptimisticData) {
  const actionDataKeys = Object.keys(actionData);

  if (!actionOptimisticData) {
    return actionDataKeys;
  }

  return actionDataKeys.filter(field => actionOptimisticData[field] === undefined);
}
