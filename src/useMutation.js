import useDispatcher from './useDispatcher';

export default function useMutation(mutation, options) {
  const [dispatch, state] = useDispatcher();

  return {
    ...state,
    dispatch(dispatchOptions) {
      return dispatch(mutation, {
        ...options,
        ...dispatchOptions,
      });
    },
  };
}
