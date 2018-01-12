import ReadStore from './ReadStore';

const TRANSPORTER_STATE = 'transporter';

export default function createSelector(callback) {
  return (state, props) => {
    const selector = callback(new ReadStore(state[TRANSPORTER_STATE]), props);

    return selector.getData();
  };
}
