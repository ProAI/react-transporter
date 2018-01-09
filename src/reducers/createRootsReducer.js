function getValuePosition(id, values) {
  let position = 0;
  values.forEach((key) => {
    if (values[key].id === id) position = key;
  });

  return position;
}

function rootExists(action, name) {
  return (action.data && action.data.names[name]) === true;
}

export default function createRootsReducer(data) {
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
      Object.keys(action.optimisticData.roots).forEach((name) => {
        // create root for optimistic value
        const value = {
          id: action.id,
          value: action.optimisticData.roots[name],
        };

        // insert root
        if (nextState.optimistic[name]) {
          nextState.optimistic[name].values.push(value);
        } else {
          nextState.optimistic[name] = {
            originalValue: nextState.data,
            values: [value],
          };
        }
      });

      // add root to store
      nextState.data = Object.assign({}, nextState.data, action.optimisticData.roots);
    }

    // TRANSPORTER_REQUEST_COMPLETED || TRANSPORTER_REQUEST_ERROR
    // revert optimistic data & apply response data for specified fields
    if (
      (action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
        action.type === 'TRANSPORTER_REQUEST_ERROR') &&
      action.optimisticData
    ) {
      Object.keys(action.optimisticData.names).forEach((name) => {
        const optimisticValues = nextState.optimistic[name].values;
        const position = getValuePosition(action.id, optimisticValues);

        if (position === optimisticValues.length - 1) {
          // if selected value is the last one, we need to delete the
          // complete optimistic entry and set the real value to the
          // response value.

          // delete all optimistic values if value is the last one
          delete nextState.optimistic[name];
          // set response value
          if (rootExists(action, name)) {
            nextState.data[name] = action.data.roots[name];
            delete action.data.roots[name];
          }
        } else {
          // if selected value is not the last one, we need to delete this
          // optimistic value and all previous values from the optimistic
          // entry. also the original value of the optimistic entry needs
          // to be refreshed.

          // update optimistic values
          nextState.optimistic[name].values.slice(position + 1);
          // update original value
          if (rootExists(action, name)) {
            nextState.optimistic[name].originalValue = action.data.roots[name];
            delete action.data.roots[name];
          }
        }
      });
    }

    // TRANSPORTER_REQUEST_COMPLETED
    // apply response data
    if (action.type === 'TRANSPORTER_REQUEST_COMPLETED') {
      // add root to store
      nextState.data = Object.assign({}, nextState.data, action.data.roots);
    }

    return nextState;
  };
}
