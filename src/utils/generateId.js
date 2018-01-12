class IdentifierGenerator {
  static counter = 1;

  static generate() {
    this.counter += 1;

    return this.counter;
  }
}

export default function generateId() {
  return IdentifierGenerator.generate();
}
