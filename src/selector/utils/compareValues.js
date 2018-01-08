import SelectorError from '../SelectorError';

export default function compareValues(valueA, operator, valueB) {
  if (operator === '=') {
    return valueA === valueB;
  }
  if (operator === '>') {
    return valueA > valueB;
  }
  if (operator === '>=') {
    return valueA >= valueB;
  }
  if (operator === '<') {
    return valueA < valueB;
  }
  if (operator === '<=') {
    return valueA <= valueB;
  }

  throw new SelectorError('UNKNOWN_WHERE_OPERATOR', { operator });
}
