export default function prepareActions(actions, dispatch) {
  const data = {};

  if (actions) {
    Object.keys(actions).forEach((key) => {
      data[key] = (...args) => dispatch(actions[key](...args));
    });
  }

  return data;
}
