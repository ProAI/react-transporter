export default function prepareSelectors(selectors, state) {
  const data = {};

  if (!selectors) {
    return data;
  }

  Object.keys(selectors).forEach((key) => {
    data[key] = selectors[key](state);
  });

  return data;
}
