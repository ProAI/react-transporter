import isString from '../utils/isString';

export default class StoreError extends Error {
  constructor(message, appendix) {
    if (isString(appendix)) {
      super(`${message} [${appendix}]`);
    } else if (appendix) {
      super(`${message} [${appendix[0]}, ${appendix[1]}]`);
    } else {
      super(message);
    }

    this.name = 'StoreError';

    // eslint-disable-next-line no-console
    console.error(`StoreError: ${this.message}`);
  }
}
