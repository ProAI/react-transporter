export default function createNameWithArgs(name, args) {
  if (!args) {
    return name;
  }

  let nameWithArgs = name;
  const argNames = Object.keys(args).sort();
  argNames.forEach((argName) => {
    nameWithArgs += `.${argName}(${args[argName]})`;
  });

  return nameWithArgs;
}
