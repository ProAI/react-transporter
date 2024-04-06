import { TYPENAME, ID } from '../constants';
import SelectorSet from './SelectorSet';
import traverseAST from './traverseAST';

const isEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export default function buildSelectorSet(cache) {
  const selectorSet = new SelectorSet();

  const handleFragment = (name, type, id, result) => {
    const entry = [type, id];
    const cachedResult = cache.selectorSet?.getFragment(name, entry);

    selectorSet.setFragment(
      name,
      entry,
      isEqual(result, cachedResult) ? cachedResult : result,
    );

    return {};
  };

  const handleEntity = (type, id, result) => ({
    [TYPENAME]: type,
    [ID]: id,
    ...result,
  });

  const result = traverseAST(cache, handleFragment, handleEntity);

  const cachedResult = cache.selectorSet?.getQuery();

  selectorSet.setQuery(isEqual(result, cachedResult) ? cachedResult : result);

  return selectorSet;
}
