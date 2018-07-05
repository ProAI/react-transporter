import { connect } from 'react-redux';
import prepareActions from './utils/prepareActions';
import prepareSelectors from './utils/prepareSelectors';

export default function createContainer(Component, customConfig) {
  const getConfig = props =>
    (typeof customConfig === 'function' ? customConfig(props) : customConfig);

  const enhance = connect(
    (state, props) => {
      const config = getConfig(props);

      return prepareSelectors(config.selectors, state);
    },
    (dispatch, props) => {
      const config = getConfig(props);

      return prepareActions(config.actions, dispatch);
    },
  );

  return enhance(Component);
}
