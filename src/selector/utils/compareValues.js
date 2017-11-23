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

  throw new Error(`Unknown operator "${operator}"`);
}
