export default function isManyLink(value) {
  return !(value === null || (typeof value[0] === 'string' || value[0] instanceof String));
}
