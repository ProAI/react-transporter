import { connect } from 'react-redux';
import prepareActions from './prepareActions';
import prepareSelectors from './prepareSelectors';
import TransporterContext from '../TransporterContext';

const enhanceWithConnect = connect(
  (state, props) => prepareSelectors(props.selectors, state),
  (dispatch, props) => prepareActions(props.actions, dispatch),
  (stateProps, dispatchProps, { props }) => ({
    ...props,
    ...stateProps,
    ...dispatchProps,
  }),
  { context: TransporterContext },
);

export default enhanceWithConnect;
