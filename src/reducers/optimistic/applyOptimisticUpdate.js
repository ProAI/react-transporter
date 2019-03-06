export default function applyOptimisticUpdate(
  actionId,
  actionOptimisticData,
  data,
  optimistic, // nullable
) {
  const nextData = { ...data };
  const nextOptimistic = {
    type: 'UPDATE',
    data: optimistic ? { ...optimistic.data } : {},
  };

  Object.keys(actionOptimisticData).forEach(field => {
    nextData[field] = actionOptimisticData[field];

    const nextField = nextOptimistic.data[field]
      ? {
          originalValue: nextOptimistic.data[field].originalValue,
          values: [...nextOptimistic.data[field].values],
        }
      : {
          originalValue: data[field],
          values: [],
        };

    nextField.values.push({
      active: true,
      id: actionId,
      value: actionOptimisticData[field],
    });

    nextOptimistic.data[field] = nextField;
  });

  return {
    data: nextData,
    optimistic: nextOptimistic,
  };
}
