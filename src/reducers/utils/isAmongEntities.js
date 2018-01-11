import isSameEntity from '../../utils/isSameEntity';

export default function isAmongEntities(entity, entities) {
  let found = -1;

  entities.forEach((key) => {
    if (isSameEntity(entity, entities[key])) found = key;
  });

  return found;
}
