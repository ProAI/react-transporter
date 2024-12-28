import DataSet from './DataSet';
import traverseAST from './traverseAST';
import { REF_KEY } from '../constants';

export default function buildDataSet(cache) {
  const data = new DataSet();

  const handleFragment = (name, type, id, value) => value;

  const handleEntity = (type, id, result) => {
    data.add({
      entities: {
        [type]: {
          [id]: result,
        },
      },
    });

    return [type, id];
  };

  const handleLink = (value) => ({
    [REF_KEY]: value,
  });

  const roots = traverseAST(cache, {
    handleFragment,
    handleEntity,
    handleLink,
    keyWithArgs: true,
  });

  data.add({ roots });

  return data;
}
