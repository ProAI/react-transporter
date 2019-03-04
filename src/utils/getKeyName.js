import isString from './isString';

const stringifyObject = obj => {
  const keys = Object.keys(obj);

  keys.sort();

  const parts = keys.map(key => {
    const isObject = obj[key] !== null && typeof obj[key] === 'object';

    const value = isObject ? stringifyObject(obj[key]) : JSON.stringify(obj[key]);

    return `"${key}":${value}`;
  });

  return `{${parts.join(',')}}`;
};

export default function getKeyName(name) {
  if (isString(name)) {
    return name;
  }

  return `${name[0]}(${stringifyObject(name[1])})`;
}
