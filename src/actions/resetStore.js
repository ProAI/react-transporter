export default function resetStore() {
  return {
    type: 'TRANSPORTER_STORE_RESET',
    lastReset: new Date().getTime(),
  };
}
