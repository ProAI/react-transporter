import isSameEntity from '../../utils/isSameEntity';

export default function isAmongEntities(entity, entities) {
  let found = -1;

  entities.forEach((checkEntity, key) => {
    if (isSameEntity(entity, checkEntity)) found = key;
  });

  return found;
}
