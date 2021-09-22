import { createDispatchHook } from 'react-redux';
import TransporterContext from '../TransporterContext';

const useDispatch = createDispatchHook(TransporterContext);

export default useDispatch;
