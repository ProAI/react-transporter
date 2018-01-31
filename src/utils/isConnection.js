export default function isConnection(value) {
  // A string has also a link property, so we also need to check if value is
  // not a function, which it would be in case of a string.
  return (
    value !== undefined &&
    value !== null &&
    value.link !== undefined &&
    typeof value.link !== 'function'
  );
}
