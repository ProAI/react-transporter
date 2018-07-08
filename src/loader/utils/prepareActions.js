export default function prepareActions(actions, dispatch) {
  const data = {};

  if (!actions) {
    return data;
  }

  Object.keys(actions).forEach((key) => {
    data[key] = (...args) => dispatch(actions[key](...args));
  });

  return data;
}
