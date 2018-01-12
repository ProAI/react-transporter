export default function getPosition(id, values) {
  let position = -1;
  values.forEach((value, key) => {
    if (value.id === id) position = key;
  });

  return position;
}
