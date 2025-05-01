import React, { createElement } from 'react';
import TransporterContext from '../TransporterContext';

/* eslint-disable react/prop-types */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    const { fallbackRender, onReset, children } = this.props;

    if (error) {
      return (
        fallbackRender &&
        createElement(fallbackRender, {
          error,
          reset: () => {
            onReset();
            this.setState({ error: null });
          },
        })
      );
    }

    return children;
  }
}
/* eslint-enable */

ErrorBoundary.contextType = TransporterContext;

export default ErrorBoundary;
