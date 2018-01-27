import selectAdvanced from './selectAdvanced';

export default function select(type, idOrIds, query) {
  return selectAdvanced(store => store.select(type, idOrIds, query));
}
