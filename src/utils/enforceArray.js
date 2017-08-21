export default function enforceArray(ids) {
  return typeof ids === 'string' || ids instanceof String ? [ids] : ids;
}
