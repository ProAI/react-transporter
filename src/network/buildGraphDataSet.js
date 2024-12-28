import { TYPENAME, ID } from '../constants';
import GraphDataSet from './GraphDataSet';
import traverseAST from './traverseAST';

const isEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export default function buildGraphDataSet(cache) {
  const graphData = new GraphDataSet();

  const handleFragment = (name, type, id, result) => {
    const entry = [type, id];
    const cachedResult = cache.graphData?.getFragment(name, entry);

    graphData.setFragment(name, entry, {
      [TYPENAME]: type,
      [ID]: id,
      ...(isEqual(result, cachedResult) ? cachedResult : result),
    });

    return {};
  };

  const handleEntity = (type, id, result) => ({
    [TYPENAME]: type,
    [ID]: id,
    ...result,
  });

  const handleLink = (value) => value;

  const result = traverseAST(cache, {
    handleFragment,
    handleEntity,
    handleLink,
  });

  const cachedResult = cache.graphData?.getQuery();

  graphData.setQuery(isEqual(result, cachedResult) ? cachedResult : result);

  return graphData;
}
