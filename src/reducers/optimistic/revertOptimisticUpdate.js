const updateValue = (position, field, actionData, data, optimistic) => {
  const { originalValue, values } = optimistic.data[field];
  const isLastPosition = position === values.length - 1;

  // There is a newer optimistic or response value
  if (!isLastPosition || !values[position].active) {
    return data;
  }

  const nextData = { ...data };
  const hasActionData = actionData && actionData[field] !== undefined;

  if (hasActionData) {
    // If there is a response value, replace optimistic value with response
    // value.
    nextData[field] = actionData[field];
  } else if (values.length === 1) {
    if (originalValue === undefined) {
      // Delete optimistic value, if there is no original value.
      delete nextData[field];
    } else {
      // Revert to original value.
      nextData[field] = originalValue;
    }
  } else {
    // Revert to previous value. Since we have already checked that this value
    // is active, we can assume that the previous value is also active. The
    // previous value must be active, because we assume that if there is a
    // response of a newer request, this response has the most up to date
    // value.
    nextData[field] = values[position - 1].value;
  }

  return nextData;
};

const updateOptimisticUpdate = (position, field, actionData, optimistic) => {
  const { values } = optimistic.data[field];
  const nextOptimistic = {
    type: 'UPDATE',
    data: {
      ...optimistic.data,
    },
  };

  // Remove optimistic update if this is the only optimistic update.
  if (values.length === 1) {
    delete nextOptimistic.data[field];

    return nextOptimistic;
  }

  const hasActionData = actionData && actionData[field] !== undefined;
  const nextField = {
    originalValue: nextOptimistic.data[field].originalValue,
    values: [...nextOptimistic.data[field].values],
  };

  if (hasActionData && values[position].active) {
    // Update original value.
    nextField.originalValue = actionData[field];

    // Deprecate previous values.
    nextField.values = nextField.values.map((value, key) =>
      key < position ? { ...value, active: false } : value,
    );
  }

  // Delete this optimistic update.
  nextField.values.splice(position, 1);

  nextOptimistic.data[field] = nextField;

  return nextOptimistic;
};

export default function revertOptimisticUpdate(
  actionId,
  actionOptimisticData,
  actionData, // nullable
  data,
  optimistic,
) {
  const nextState = {
    data,
    optimistic,
  };

  Object.keys(actionOptimisticData).forEach(field => {
    const { values } = optimistic.data[field];
    const position = values.findIndex(value => value.id === actionId);

    // throw error if not found
    if (position === -1) {
      throw new Error('Position not found.');
    }

    // Update field value.
    nextState.data = updateValue(position, field, actionData, nextState.data, nextState.optimistic);

    // Update optimistic update.
    nextState.optimistic = updateOptimisticUpdate(
      position,
      field,
      actionData,
      nextState.optimistic,
    );
  });

  if (Object.keys(nextState.optimistic.data).length === 0) {
    nextState.optimistic = null;
  }

  return nextState;
}
