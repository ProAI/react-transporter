import applyOptimisticCreate from './optimistic/applyOptimisticCreate';
import applyOptimisticUpdate from './optimistic/applyOptimisticUpdate';
import applyOptimisticDelete from './optimistic/applyOptimisticDelete';
import revertOptimisticUpdate from './optimistic/revertOptimisticUpdate';
import revertOptimisticDelete from './optimistic/revertOptimisticDelete';
import filterOutOptimisticData from './optimistic/filterOutOptimisticData';
import filterOutOptimisticTrash from './optimistic/filterOutOptimisticTrash';
import EntityMap from '../utils/EntityMap';

function cloneEntityObject(obj) {
  const nextObj = {};

  Object.keys(obj).forEach(type => {
    nextObj[type] = { ...obj[type] };
  });

  return nextObj;
}

export default function createEntitiesReducer(initialData) {
  const initialState = {
    data: initialData,
    optimistic: {},
  };

  return function reducer(state = initialState, action) {
    if (action.type === 'TRANSPORTER_STORE_RESET') {
      return initialState;
    }

    // TRANSPORTER_REQUEST_START
    // Apply optimistic data from response.
    if (action.type === 'TRANSPORTER_REQUEST_START' && action.optimisticData) {
      const nextData = new EntityMap(cloneEntityObject(state.data));
      const nextOptimistic = new EntityMap(cloneEntityObject(state.optimistic));

      // insertions/updates
      if (action.optimisticData.entities) {
        const actionOptimisticEntityMap = new EntityMap(action.optimisticData.entities);

        actionOptimisticEntityMap.forEach(([actionOptimisticEntity, type, id]) => {
          const isOptimisticCreate = !nextData.get(type, id);

          if (isOptimisticCreate) {
            // apply optimistic create
            const { data, optimistic } = applyOptimisticCreate(action.id, actionOptimisticEntity);

            nextData.set(type, id, data);
            nextOptimistic.set(type, id, optimistic);
          } else {
            // apply optimistic update
            const { data, optimistic } = applyOptimisticUpdate(
              action.id,
              actionOptimisticEntity,
              nextData.get(type, id),
              nextOptimistic.get(type, id),
            );

            nextData.set(type, id, data);
            nextOptimistic.set(type, id, optimistic);
          }
        });
      }

      // deletions
      if (action.optimisticData.trash) {
        const actionOptimisticTrash = action.optimisticData.trash;

        actionOptimisticTrash.forEach(bla => {
          const [type, id] = bla;
          // apply optimistic delete
          const { optimistic } = applyOptimisticDelete(action.id, nextData.get(type, id));

          nextData.delete(type, id);
          nextOptimistic.set(type, id, optimistic);
        });
      }

      return {
        data: nextData.toSource(),
        optimistic: nextOptimistic.toSource(),
      };
    }

    // TRANSPORTER_REQUEST_COMPLETED || TRANSPORTER_REQUEST_ERROR
    // Revert optimistic data and apply response data.
    if (
      action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
      action.type === 'TRANSPORTER_REQUEST_ERROR'
    ) {
      const nextData = new EntityMap(cloneEntityObject(state.data));
      const nextOptimistic = new EntityMap(cloneEntityObject(state.optimistic));

      // insertions/updates
      if (action.optimisticData && action.optimisticData.entities) {
        const actionEntityMap = new EntityMap(action.data && action.data.entities);
        const actionOptimisticEntityMap = new EntityMap(action.optimisticData.entities);

        actionOptimisticEntityMap.forEach(([actionOptimisticEntity, type, id]) => {
          const isOptimisticCreate =
            nextOptimistic.get(type, id) && nextOptimistic.get(type, id).type === 'CREATE';

          if (isOptimisticCreate) {
            // revert optimistic create
            nextData.delete(type, id);
            nextOptimistic.delete(type, id);
          } else {
            // revert optimistic update
            const { data, optimistic } = revertOptimisticUpdate(
              action.id,
              actionOptimisticEntity,
              actionEntityMap.get(type, id),
              nextData.get(type, id),
              nextOptimistic.get(type, id),
            );

            nextData.set(type, id, data);
            if (optimistic) {
              nextOptimistic.set(type, id, optimistic);
            } else {
              nextOptimistic.delete(type, id);
            }
          }
        });
      }

      // deletions
      if (action.optimisticData && action.optimisticData.trash) {
        const actionTrash = action.data && action.data.trash;
        const actionOptimisticTrash = action.optimisticData.trash;

        actionOptimisticTrash.forEach(([type, id]) => {
          // revert optimistic delete
          const { data } = revertOptimisticDelete(
            action.id,
            actionTrash,
            [type, id],
            nextOptimistic.get(type, id),
          );

          if (data) {
            nextData.set(type, id, data);
          }
          nextOptimistic.delete(type, id);
        });
      }

      // insertions/updates
      if (action.data && action.data.entities) {
        const actionEntityMap = new EntityMap(action.data.entities);
        const actionOptimisticEntityMap = new EntityMap(
          action.optimisticData && action.optimisticData.entities,
        );

        actionEntityMap.forEach(([actionEntity, type, id]) => {
          // Set entity data
          const data = nextData.get(type, id);

          if (data) {
            // Filter out fields that are also in optimistic entity
            const fields = filterOutOptimisticData(
              actionEntity,
              actionOptimisticEntityMap.get(type, id),
            );

            fields.forEach(field => {
              data[field] = actionEntity[field];
            });
            nextData.set(type, id, data);
          } else {
            nextData.set(type, id, actionEntity);
          }
        });
      }

      // deletions
      if (action.data && action.data.trash) {
        const actionTrash = action.data.trash;
        const actionOptimisticTrash = action.optimisticData && action.optimisticData.trash;

        // Filter out links that are also in optimistic trash
        const links = filterOutOptimisticTrash(actionTrash, actionOptimisticTrash);

        // Delete entity
        links.forEach(([type, id]) => {
          nextData.delete(type, id);
        });
      }

      return {
        data: nextData.toSource(),
        optimistic: nextOptimistic.toSource(),
      };
    }

    return state;
  };
}
