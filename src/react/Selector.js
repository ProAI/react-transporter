import { shallowEqual } from 'react-redux';
import useSelector from './hooks/useSelector';

function Selector({ selectors, children }) {
  const data = useSelector((state) => {
    const result = {};

    if (!selectors) {
      return result;
    }

    Object.keys(selectors).forEach((key) => {
      result[key] = selectors[key](state);
    });

    return result;
  }, shallowEqual);

  return children(data);
}

export default Selector;
