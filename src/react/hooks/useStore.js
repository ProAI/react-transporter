import { createStoreHook } from 'react-redux';
import TransporterContext from '../TransporterContext';

const useStore = createStoreHook(TransporterContext);

export default useStore;
