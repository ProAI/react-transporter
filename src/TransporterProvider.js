import React, { useSyncExternalStore } from 'react';
import TransporterContext from './TransporterContext';

/* eslint-disable react/prop-types */
function TransporterProvider({ children, client }) {
  if (!client) {
    throw new Error(
      'TransporterProvider: You must provide a Transporter instance.',
    );
  }

  const store = client.rootStore;

  useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);

  return (
    <TransporterContext.Provider value={{ client, store }}>
      {children}
    </TransporterContext.Provider>
  );
}
/* eslint-enable */

export default TransporterProvider;
