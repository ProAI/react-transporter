import React from 'react';
import Transporter from '../core/Transporter';

class Provider extends React.Component {
  componentDidMount() {
    // eslint-disable-next-line react/prop-types
    Transporter.setClient(this.props.client);
  }

  render() {
    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}

export default Provider;
