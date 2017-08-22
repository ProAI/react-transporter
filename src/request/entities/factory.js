import Entity from './Entity';

export default function factory(id, attributes) {
  return new Entity(id, attributes);
}
