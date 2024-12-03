import { TYPENAME, ID } from './constants';

export default function ref(type, id) {
  return {
    [TYPENAME]: [type],
    [ID]: id,
  };
}
