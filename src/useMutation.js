import { useContext } from 'react';
import TransporterContext from './TransporterContext';

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

export default function useMutation(mutation, options) {
  const context = useContext(TransporterContext);

  if (!context) {
    throw new Error(
      '"useMutation" hook is used outside of TransporterContext.',
    );
  }

  let instance;

  const dispatch = (dispatchOptions) => {
    if (instance) {
      throw new Error('Mutation was dispatched before.');
    }

    instance = context.store.mutate(mutation, {
      ...options,
      ...dispatchOptions,
    });
    return instance;
  };

  const state = {
    get ok() {
      if (!instance || instance.status === PENDING) {
        return null;
      }

      return instance.status === FULFILLED;
    },
    get loading() {
      if (!instance) {
        return false;
      }

      return instance.status === PENDING;
    },
    get executed() {
      if (!instance) {
        return false;
      }

      return instance.status === FULFILLED || instance.status === REJECTED;
    },
    /* get errors() {
      // TODO
    },
    get networkError() {
      // TODO
    }, */
  };

  return [dispatch, state];
}
