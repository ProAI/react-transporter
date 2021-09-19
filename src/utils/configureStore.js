import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import createRequest from '../request/createRequest';
import createReducer from '../reducers';

export default function configureStore(data, network) {
  const middleware = () => (next) => (action) => {
    if (['TRANSPORTER_QUERY', 'TRANSPORTER_MUTATION'].includes(action.type)) {
      return next(createRequest(action, network.fetch));
    }

    return next(action);
  };

  const composedEnhancers = composeWithDevTools(
    applyMiddleware(middleware, thunk),
  );

  const roots = data && data.roots ? data.roots : {};
  const entities = data && data.entities ? data.entities : {};

  const reducer = createReducer(roots, entities);

  return createStore(reducer, {}, composedEnhancers);
}
