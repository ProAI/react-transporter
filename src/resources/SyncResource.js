import { FULFILLED } from '../constants';

/* eslint-disable arrow-body-style */
class ProxyResource {
  status = FULFILLED;

  response;

  constructor(response) {
    this.response = response;
  }

  read = () => {
    return this.response;
  };
}
/* eslint-enable */

export default ProxyResource;
