import selectAdvanced from './selectAdvanced';

export default function selectByRoot(name, query) {
  return selectAdvanced(store => store.selectByRoot(name, query));
}
