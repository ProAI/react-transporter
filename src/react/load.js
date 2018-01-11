import { connect } from 'react-redux';
import nanoid from 'nanoid';
import getPosition from '../utils/getPosition';

const TRANSPORTER_STATE = 'transporter';

function getStoredRequestById(id, requests) {
  const position = getPosition(id, requests);

  return position ? requests[position] : null;
}

function load(createRequest, config = {}) {
  const mapStateToProps = (state, props) => {
    const fromState = selector => selector(state, props);
    const request = createRequest(props, fromState);

    // create request id if not present
    if (!request.id) request.id = nanoid();

    const storedRequest = getStoredRequestById(request.id, state[TRANSPORTER_STATE].requests);

    return {
      request,
      loading: storedRequest ? storedRequest.loading : undefined,
      error: storedRequest ? storedRequest.error : undefined,
    };
  };

  const mapDispatchToProps = dispatch => ({
    dispatch,
    // TODO
    // refetch: refetchQuery => dispatch(Object.assign({}, refetchQuery, query)),
    // fetchMore: fetchMoreQuery => dispatch(Object.assign({}, fetchMoreQuery, query)),
  });

  const mergeProps = ({ request, ...stateProps }, { dispatch, ...dispatchProps }, ownProps) => {
    // TODO
    // dispatch query on server and on client
    // if (typeof window === 'undefined') {
    //   dispatch(request);
    // }

    const queryProps = Object.assign({}, stateProps, dispatchProps);
    const finalProps = Object.assign({}, { [config.name || 'query']: queryProps }, ownProps);
    return config.props ? config.props(finalProps) : finalProps;
  };

  return connect(mapStateToProps, mapDispatchToProps, mergeProps);
}

export default load;
