const getValue = (value) => {
  if (value === null) {
    return null;
  }

  if (typeof value === 'object') {
    // eslint-disable-next-line no-use-before-define
    return stringifyObject(value);
  }

  return JSON.stringify(value);
};

const stringifyObject = (obj) => {
  const keys = Object.keys(obj);

  keys.sort();

  const parts = keys
    .map((key) => {
      const value = getValue(obj[key]);

      return value === null ? value : `"${key}":${value}`;
    })
    .filter((value) => value !== null);

  if (parts.length === 0) {
    return null;
  }

  return `{${parts.join(',')}}`;
};

export default function makeAttributeKeyWithArgs(name, args) {
  const attributes = stringifyObject(args);

  return `${name}${attributes ? `(${attributes})` : ''}`;
}
