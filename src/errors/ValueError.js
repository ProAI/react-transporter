class ValueError extends Error {
  path;

  constructor(message, path) {
    super(message);

    this.path = path;
    this.name = 'ValueError';
  }
}

export default ValueError;
