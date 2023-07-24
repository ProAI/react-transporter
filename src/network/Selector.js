export default class Selector {
  data;

  constructor(data) {
    this.data = data;
  }

  isEqual = (data) => JSON.stringify(this.data) === JSON.stringify(data);

  toObject = () => this.data;
}
