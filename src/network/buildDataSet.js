import DataSet from './DataSet';
import traverseAST from './traverseAST';

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

  const roots = traverseAST(cache, handleFragment, handleEntity);

  data.add({ roots });

  return data;
}
