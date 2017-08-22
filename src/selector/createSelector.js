import SelectorFactory from './SelectorFactory';

export default function createSelector(callback) {
  return (state, props) => {
    const selector = callback(new SelectorFactory(state.transporter), props);

    return selector.getData();
  };
}
