import { connect } from 'react-redux';
import { compose } from 'redux';
import prepareActions from './utils/prepareActions';
import prepareSelectors from './utils/prepareSelectors';
import TransporterContext from './TransporterContext';

export default function createComponent(Component, makeConfig, customOptions) {
  const options = {
    middleware: (customOptions && customOptions.middleware) || null,
  };

  const enhanceWithConnect = connect(
    (state, props) => {
      const config = makeConfig(props);

      return prepareSelectors(config.selectors, state);
    },
    (dispatch, props) => {
      const config = makeConfig(props);

      return prepareActions(config.actions, dispatch);
    },
    null,
    { context: TransporterContext },
  );

  if (options.middleware) {
    const enhance = compose(...options.middleware, enhanceWithConnect);

    return enhance(Component);
  }

  return enhanceWithConnect(Component);
}
