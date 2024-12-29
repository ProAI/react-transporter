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
    .map((k) => {
      const value = getValue(obj[k]);

      return value === null ? value : `"${k}":${value}`;
    })
    .filter((value) => value !== null);

  if (parts.length === 0) {
    return null;
  }

  return `{${parts.join(',')}}`;
};

export default function key(name, variables) {
  const attributes = stringifyObject(variables);

  return `${name}${attributes ? `(${attributes})` : ''}`;
}
