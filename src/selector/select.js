import selectAdvanced from './selectAdvanced';

export default function select(ast, options) {
  return selectAdvanced(store => store.select(ast, options || {}));
}
