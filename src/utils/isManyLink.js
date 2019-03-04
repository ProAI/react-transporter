import isString from './isString';

export default function isManyLink(value) {
  return !(value === null || isString(value[0]));
}
