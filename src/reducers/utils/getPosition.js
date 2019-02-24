export default function getPosition(id, values) {
  const position = values.findIndex(value => value.id === id);

  // throw error if not found
  if (position === -1) {
    throw new Error('Position not found.');
  }

  return position;
}
