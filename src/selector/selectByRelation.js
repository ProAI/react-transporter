import selectAdvanced from './selectAdvanced';

export default function selectByRelation(type, idOrIds, name, query) {
  return selectAdvanced(store => store.selectByRelation(type, idOrIds, name, query));
}
