class ValueError extends Error {
  constructor() {
    super('Undefined value.');
    this.name = 'ValueError';
  }
}

export default ValueError;
