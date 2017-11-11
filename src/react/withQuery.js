import { connect } from 'react-redux';
import { getRequestName } from '../utils';

function withQuery(requestFunc, config = {}) {
  const mapStateToProps = (state, props) => {
    const request = requestFunc(props);
    const requestName = request.name || getRequestName(request.schema);

    const { requests } = state.transporter;
    return {
      loading: requests[requestName] ? requests[requestName].loading : undefined,
      error: requests[requestName] ? requests[requestName].error : undefined,
    };
  };

  const mapDispatchToProps = (dispatch, props) => {
    if (typeof window === 'undefined') {
      dispatch(requestFunc(props));
    }

    return {
      // TODO
      // refetch: refetchQuery => dispatch(Object.assign({}, refetchQuery, query)),
      // fetchMore: fetchMoreQuery => dispatch(Object.assign({}, fetchMoreQuery, query)),
    };
  };

  const mergeProps = (stateProps, dispatchProps, ownProps) => {
    const queryProps = Object.assign({}, stateProps, dispatchProps);
    const tempProps = Object.assign({}, { [config.name || 'query']: queryProps }, ownProps);
    return config.props ? config.props(tempProps) : tempProps;
  };

  return Component => connect(mapStateToProps, mapDispatchToProps, mergeProps)(Component);
}

export default withQuery;
