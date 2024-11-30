import useDispatcher from './useDispatcher';

export default function useQuery(query, options) {
  const [dispatch, state] = useDispatcher();

  return {
    ...state,
    dispatch(dispatchOptions) {
      return dispatch(query, {
        ...options,
        ...dispatchOptions,
      });
    },
  };
}
