import ReadStore from './ReadStore';

const TRANSPORTER_STATE = 'transporter';

export default function createSelector(callback) {
  return (state, props) => {
    try {
      const selector = callback(new ReadStore(state[TRANSPORTER_STATE]), props);

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
