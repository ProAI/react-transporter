export default function makeSelectorKey(fragment) {
  if (!fragment) {
    return '_';
  }

  const [type, id] = fragment.entry;

  return `${fragment.name}.${type}.${id}`;
}
