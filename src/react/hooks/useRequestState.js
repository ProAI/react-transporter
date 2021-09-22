import { useCallback, useState } from 'react';
import getTimestamp from '../../utils/getTimestamp';

export default function useRequestState(
  initialConfig,
  initialProps,
  hasCodeSplit,
) {
  // Set bundle loading & errors
  const initialState = () => {
    const loaderState = {
      startTime: getTimestamp(),
      endTime: null,
    };

    // Set bundle loading & errors
    const loaders = hasCodeSplit
      ? {
          bundle: {
            ...loaderState,
            loading: hasCodeSplit ? 'block' : null,
            error: null,
          },
        }
      : {};

    // Set resources loading & errors
    Object.keys(initialConfig.loaders).forEach((key) => {
      loaders[key] = {
        ...loaderState,
        loading: 'block',
        error: null,
      };
    });

    return {
      props: initialProps,
      loaders,
    };
  };

  const [state, setState] = useState(initialState);

  const setRequestState = useCallback((key, loading, error, props = null) => {
    // Set loading and errors state. For start and end time we assume that if updatedLoading is
    // true, a new request will begin and if updatedLoading is false, a request will end.
    const time = getTimestamp();

    setState((prevState) => ({
      props: props || prevState.props,
      loaders: {
        ...prevState.loaders,
        [key]: {
          startTime: loading ? time : prevState.loaders[key].startTime,
          endTime: !loading ? time : prevState.loaders[key].endTime,
          loading,
          error: error === undefined ? prevState.loaders[key].error : error,
        },
      },
    }));
  }, []);

  return [state, setRequestState];
}
