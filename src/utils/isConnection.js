export default function isConnection(value) {
  if (!value) {
    return false;
  }

  const hasLinkProperty = Object.prototype.hasOwnProperty.call(value, 'link');

  // A string has also a link property, so we also need to check if value is
  // not a function, which it would be in case of a string.
  return hasLinkProperty && typeof value.link !== 'function';
}
