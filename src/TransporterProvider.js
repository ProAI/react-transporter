import React, { useSyncExternalStore } from 'react';
import TransporterContext from './TransporterContext';

/* eslint-disable react/prop-types */
function TransporterProvider({ children, client }) {
  if (!client) {
    throw new Error(
      'TransporterProvider: You must provide a Transporter instance.',
    );
  }

  const node = client.root;
  useSyncExternalStore(
    node.subscribe,
    () => {},
    () => {}, // TODO: Check this!
  );

  return (
    <TransporterContext.Provider value={{ client, node }}>
      {children}
    </TransporterContext.Provider>
  );
}
/* eslint-enable */

export default TransporterProvider;
