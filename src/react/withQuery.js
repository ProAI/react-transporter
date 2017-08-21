// @flow
import { connect } from 'react-redux';

function withQuery(request, config) {
  const mapStateToProps = state => ({
    loading: state.api.requests[config.name].loading,
    error: state.api.requests[config.name].error,
  });

  const mapDispatchToProps = (dispatch) => {
    dispatch(request);

    return {
      // refetch: refetchQuery => dispatch(Object.assign({}, refetchQuery, query)),
      // fetchMore: fetchMoreQuery => dispatch(Object.assign({}, fetchMoreQuery, query)),
    };
  };

  const mergeProps = (stateProps, dispatchProps, ownProps) => {
    const queryProps = Object.assign({}, stateProps, dispatchProps);
    const tempProps = Object.assign({}, { [config.name]: queryProps }, ownProps);
    return config.props(tempProps);
  };

  return Component => connect(mapStateToProps, mapDispatchToProps, mergeProps)(Component);
}

export default withQuery;
