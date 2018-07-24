export default function getName(name) {
  if (typeof name === 'string' || name instanceof String) {
    return name;
  }

  return `${name[0]}(${JSON.stringify(name[1], Object.keys(name[1]).sort())})`;
}
