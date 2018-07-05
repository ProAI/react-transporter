export default function prepareSelectors(selectors, state) {
  const data = {};

  if (selectors) {
    Object.keys(selectors).forEach((key) => {
      data[key] = selectors[key](state);
    });
  }

  return data;
}
