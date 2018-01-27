import React from 'react';

const Component = null;
const env = 'node' || 'browser';
const serverMode = 'resolve' || 'defer';

/* eslint-disable react/prop-types */
class AsyncData extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.firstRender = false;

    this.state =
      serverMode === 'defer'
        ? {
          loading: true,
          error: null,
        }
        : {
          loading: false,
          error: null, // TODO somehow get error information from server
        };
  }

  componentDidMount() {
    // fetch data on client
    if (this.firstRender || serverMode === 'defer') {
      this.fetch();
    }

    if (!this.firstRender) {
      this.firstRender = true;
    }
  }

  asyncBootstrap() {
    // don't wait with rendering on client
    if (env === 'browser') {
      return true;
    }

    // wait for async call on server
    return this.fetch().then(() => true);
  }

  fetch() {
    return this.props.dispatch(this.props.query).then(
      () => {
        this.setState({
          loading: false,
        });
      },
      (error) => {
        this.setState({
          loading: false,
          error,
        });
      },
    );
  }

  render() {
    const queryProps = {
      query: {
        loading: this.state.loading,
        error: this.state.error,
      },
    };

    return <Component {...queryProps} {...this.props} />;
  }
}
/* eslint-enable */

export default AsyncData;
