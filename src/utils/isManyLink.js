export default function isManyLink(value) {
  return !(
    value.link === null ||
    (typeof value.link[0] === 'string' || value.link[0] instanceof String)
  );
}
