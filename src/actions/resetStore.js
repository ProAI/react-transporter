import getTimestamp from '../utils/getTimestamp';

export default function resetStore(data) {
  return {
    type: 'TRANSPORTER_STORE_RESET',
    data,
    lastReset: getTimestamp(),
  };
}
