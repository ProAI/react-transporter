import { connect } from 'react-redux';
import prepareActions from './prepareActions';
import prepareSelectors from './prepareSelectors';

const enhance = connect(
  (state, props) => prepareSelectors(props.selectors, state),
  (dispatch, props) => prepareActions(props.actions, dispatch),
  (stateProps, dispatchProps, { props }) => Object.assign({}, props, stateProps, dispatchProps),
);

export default enhance;
