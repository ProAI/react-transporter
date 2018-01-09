function getValuePosition(id, values) {
  let position = 0;
  values.forEach((key) => {
    if (values[key].id === id) position = key;
  });

  return position;
}

function fieldExists(action, type, id, field) {
  if (
    action.data &&
    action.data.entities &&
    action.data.entities[type] &&
    action.data.entities[type][id] &&
    action.data.entities[type][id][field]
  ) {
    return true;
  }

  return false;
}

export default function createEntitiesReducer(data) {
  const initialState = {
    data,
    optimistic: {},
  };

  return function reducer(state = initialState, baseAction) {
    const nextState = { ...state };
    const action = { ...baseAction };

    // TRANSPORTER_REQUEST_START
    // apply optimistic data
    if (action.type === 'TRANSPORTER_REQUEST_START' && action.optimisticData) {
      Object.keys(action.optimisticData.entities).forEach((type) => {
        Object.keys(action.optimisticData.entities[type]).forEach((id) => {
          // create optimistic data history
          if (!nextState.optimistic[type]) nextState.optimistic[type] = {};
          if (!nextState.optimistic[type][id]) {
            nextState.optimistic[type][id] = {};
          }
          Object.keys(action.optimisticData.entities[type][id]).forEach((field) => {
            // create entry for optimistic value
            const value = {
              id: action.id,
              value: action.optimisticData.entities[type][id][field],
            };

            // insert entry
            if (nextState.optimistic[type][id][field]) {
              nextState.optimistic[type][id][field].values.push(value);
            } else {
              nextState.optimistic[type][id][field] = {
                originalValue: nextState.data[type][id],
                values: [value],
              };
            }
          });

          // add entity to store
          if (!nextState.data[type]) nextState.data[type] = {};
          nextState.data[type][id] = Object.assign(
            {},
            nextState.data[type][id],
            action.optimisticData.entities[type][id],
          );
        });
      });
    }

    // TRANSPORTER_REQUEST_COMPLETED || TRANSPORTER_REQUEST_ERROR
    // revert optimistic data & apply response data for specified fields
    if (
      (action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
        action.type === 'TRANSPORTER_REQUEST_ERROR') &&
      action.optimisticData
    ) {
      Object.keys(action.optimisticData.entities).forEach((type) => {
        Object.keys(action.optimisticData.entities[type]).forEach((id) => {
          Object.keys(action.optimisticData.entities[type][id]).forEach((field) => {
            const optimisticValues = nextState.optimistic[type][id][field].values;
            const position = getValuePosition(action.id, optimisticValues);

            if (position === optimisticValues.length - 1) {
              // if selected value is the last one, we need to delete the
              // complete optimistic entry and set the real value to the
              // response value.

              // delete all optimistic values if value is the last one
              delete nextState.optimistic[type][id][field];
              // set response value
              if (fieldExists(action, type, id, field)) {
                nextState.data[type][id][field] = action.data.entities[type][id][field];
                delete action.data.entities[type][id][field];
              }
            } else {
              // if selected value is not the last one, we need to delete this
              // optimistic value and all previous values from the optimistic
              // entry. also the original value of the optimistic entry needs
              // to be refreshed.

              // update optimistic values
              nextState.optimistic[type][id][field].values.slice(position + 1);
              // update original value
              if (fieldExists(action, type, id, field)) {
                nextState.optimistic[type][id][field].originalValue =
                  action.data.entities[type][id][field];
                delete action.data.entities[type][id][field];
              }
            }
          });
        });
      });
    }

    // TRANSPORTER_REQUEST_COMPLETED
    // apply response data
    if (action.type === 'TRANSPORTER_REQUEST_COMPLETED') {
      Object.keys(action.data.entities).forEach((type) => {
        Object.keys(action.data.entities[type]).forEach((id) => {
          // add entity to store
          if (!nextState.data[type]) nextState.data[type] = {};
          nextState.data[type][id] = Object.assign(
            {},
            nextState.data[type][id],
            action.data.entities[type][id],
          );
        });
      });
    }

    return nextState;
  };
}
