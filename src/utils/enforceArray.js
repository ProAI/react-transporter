export default function enforceArray(data) {
  return typeof data[0] === 'string' || data[0] instanceof String ? [data] : data;
}
