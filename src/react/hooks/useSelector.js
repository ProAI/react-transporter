import { createSelectorHook } from 'react-redux';
import TransporterContext from '../TransporterContext';

const useSelector = createSelectorHook(TransporterContext);

export default useSelector;
