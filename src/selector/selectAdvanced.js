import ReadStore from './ReadStore';

export default function selectAdvanced(callback) {
  return (state, props) => callback(new ReadStore(state), props);
}
