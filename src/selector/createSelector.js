import ReadStore from './ReadStore';

export default function createSelector(callback) {
  return (state, props) => {
    try {
      const selector = callback(new ReadStore(state.transporter), props);

      return selector.getData();
    } catch (error) {
      // console log error message if error is SelectorError
      if (error.constructor.name === 'SelectorError') {
        // eslint-disable-next-line no-console
        console.error(error.getMessage());
      }

      throw error;
    }
  };
}
