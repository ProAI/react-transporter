import isString from './isString';

const stringifyObject = obj => {
  const getValue = value => {
    if (value === null) {
      return null;
    }

    if (typeof value === 'object') {
      return stringifyObject(value);
    }

    return JSON.stringify(value);
  };

  const keys = Object.keys(obj);

  keys.sort();

  const parts = keys
    .map(key => {
      const value = getValue(obj[key]);

      return value === null ? value : `"${key}":${value}`;
    })
    .filter(value => value !== null);

  if (parts.length === 0) {
    return null;
  }

  return `{${parts.join(',')}}`;
};

export default function getKeyName(name) {
  if (isString(name)) {
    return name;
  }

  const attributes = stringifyObject(name[1]);

  return `${name[0]}${attributes ? `(${attributes})` : ''}`;
}
