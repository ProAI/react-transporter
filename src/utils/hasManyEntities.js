export default function hasManyEntities(ids) {
  return !(typeof ids[0] === 'string' || ids[0] instanceof String);
}
