import ReadStore from './ReadStore';

const TRANSPORTER_STATE = 'transporter';

export default function selectAdvanced(callback) {
  return (state, props) => callback(new ReadStore(state[TRANSPORTER_STATE]), props);
}
