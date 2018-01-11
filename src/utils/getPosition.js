export default function getPosition(id, values) {
  let position = -1;
  values.forEach((key) => {
    if (values[key].id === id) position = key;
  });

  return position;
}
