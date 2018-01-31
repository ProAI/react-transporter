import makeSelectorError from '../makeSelectorError';

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

  throw makeSelectorError('UNKNOWN_WHERE_OPERATOR', { operator });
}
