import selectAdvanced from './selectAdvanced';

export default function selectByEntity(type, idOrIds, query) {
  return selectAdvanced(store => store.selectByEntity(type, idOrIds, query));
}
