import getTimestamp from '../utils/getTimestamp';

export default function resetStore() {
  return {
    type: 'TRANSPORTER_STORE_RESET',
    lastReset: getTimestamp(),
  };
}
