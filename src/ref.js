import { REF_KEY } from './constants';

export default function ref(type, id) {
  return {
    [REF_KEY]: [type, id],
  };
}
