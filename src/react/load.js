import { connect } from 'react-redux';

// TODO
// parse a real graphql schema
const parseSchema = schema => schema;
const getRequestName = schema => schema;

function load(requestFunc, config = {}) {
  const mapStateToProps = (state, props) => {
    const fromState = selector => selector(state, props);
    const request = requestFunc(props, fromState);
    const schema = parseSchema(request.schema);
    const requestName = getRequestName(schema);

    const { requests } = state.transporter;
    return {
      request,
      loading: requests[requestName] ? requests[requestName].loading : undefined,
      error: requests[requestName] ? requests[requestName].error : undefined,
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
