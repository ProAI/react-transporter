import React from 'react';

class Provider extends React.Component {
  render() {
    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}

export default Provider;
