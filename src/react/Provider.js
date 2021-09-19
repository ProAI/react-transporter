import React, { useMemo } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

/* eslint-disable react/prop-types */
function Provider({ children, client }) {
  if (!client) {
    throw new Error('You must provide a transporter client.');
  }

  const store = useMemo(() => client.buildStore(), []);

  return <ReduxProvider store={store}>{children}</ReduxProvider>;
}
/* eslint-enable */

export default Provider;
