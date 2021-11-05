import { shallowEqual } from 'react-redux';
import useSelector from './useSelector';

export default function useBulkSelector(status, selectors) {
  return useSelector((state) => {
    const result = {};

    if (!selectors || status !== 'RESOLVED') {
      return result;
    }

    Object.keys(selectors).forEach((key) => {
      result[key] = selectors[key](state);
    });

    return result;
  }, shallowEqual);
}
