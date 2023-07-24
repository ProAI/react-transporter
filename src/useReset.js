import { useContext } from 'react';
import TransporterContext from './TransporterContext';

export default function useReset() {
  const context = useContext(TransporterContext);

  if (!context) {
    throw new Error('"useReset" hook is used outside of TransporterContext.');
  }

  const { store } = context;

  return () => {
    store.reset();
  };
}
