import { TYPENAME, ID } from '../constants';
import GraphDataSet from './GraphDataSet';
import traverseAST from './traverseAST';

const isEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export default function buildGraphDataSet(cache) {
  const graphData = new GraphDataSet();

  const handleFragment = (name, type, id, result) => {
    const cachedResult = cache.graphData?.getFragment(name, type, id);

    // Keep cached result if there are no changes, so that we can check graphDataByRequest against
    // the result in order to determine an update.
    graphData.setFragment(
      name,
      type,
      id,
      isEqual(result, cachedResult)
        ? cachedResult
        : {
            [TYPENAME]: type,
            [ID]: id,
            ...result,
          },
    );

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

  // Keep cached result if there are no changes, so that we can check graphDataByRequest against
  // the result in order to determine an update.
  graphData.setQuery(isEqual(result, cachedResult) ? cachedResult : result);

  return graphData;
}
