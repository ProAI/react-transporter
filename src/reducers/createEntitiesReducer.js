import applyOptimisticCreate from './utils/applyOptimisticCreate';
import applyOptimisticUpdate from './utils/applyOptimisticUpdate';
import applyOptimisticDelete from './utils/applyOptimisticDelete';
import revertOptimisticUpdate from './utils/revertOptimisticUpdate';
import revertOptimisticDelete from './utils/revertOptimisticDelete';
import filterOutOptimisticData from './utils/filterOutOptimisticData';
import filterOutOptimisticTrash from './utils/filterOutOptimisticTrash';
import EntityMap from './EntityMap';

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
      const entityMap = new EntityMap(JSON.parse(JSON.stringify(state.data)));
      const optimisticMap = new EntityMap(JSON.parse(JSON.stringify(state.optimistic)));

      // insertions/updates
      if (action.optimisticData.entities) {
        const actionOptimisticEntityMap = new EntityMap(action.optimisticData.entities);

        actionOptimisticEntityMap.forEach(([actionOptimisticEntity, type, id]) => {
          const isOptimisticCreate = !entityMap.get(type, id);

          if (isOptimisticCreate) {
            // apply optimistic create
            const { data, optimistic } = applyOptimisticCreate(
              action.id,
              actionOptimisticEntity,
              entityMap.get(type, id),
            );

            entityMap.set(type, id, data);
            optimisticMap.set(type, id, optimistic);
          } else {
            // apply optimistic update
            const { data, optimistic } = applyOptimisticUpdate(
              action.id,
              actionOptimisticEntity,
              entityMap.get(type, id),
              optimisticMap.get(type, id),
            );

            entityMap.set(type, id, data);
            optimisticMap.set(type, id, optimistic);
          }
        });
      }

      // deletions
      if (action.optimisticData.trash) {
        const actionOptimisticTrash = new EntityMap(action.optimisticData.trash);

        actionOptimisticTrash.forEach(([type, id]) => {
          // apply optimistic delete
          const { optimistic } = applyOptimisticDelete(action.id, entityMap.get(type, id));

          entityMap.delete(type, id);
          optimisticMap.set(type, id, optimistic);
        });
      }

      return {
        data: entityMap.toObject(),
        optimistic: optimisticMap.toObject(),
      };
    }

    // TRANSPORTER_REQUEST_COMPLETED || TRANSPORTER_REQUEST_ERROR
    // Revert optimistic data and apply response data.
    if (
      action.type === 'TRANSPORTER_REQUEST_COMPLETED' ||
      action.type === 'TRANSPORTER_REQUEST_ERROR'
    ) {
      const entityMap = new EntityMap(JSON.parse(JSON.stringify(state.data)));
      const optimisticMap = new EntityMap(JSON.parse(JSON.stringify(state.optimistic)));

      // insertions/updates
      if (action.optimisticData && action.optimisticData.entities) {
        const actionEntityMap = new EntityMap(action.data && action.data.entities);
        const actionOptimisticEntityMap = new EntityMap(action.optimisticData.entities);

        actionOptimisticEntityMap.forEach(([actionOptimisticEntity, type, id]) => {
          const isOptimisticCreate =
            optimisticMap.get(type, id) && optimisticMap.get(type, id).type === 'CREATE';

          if (isOptimisticCreate) {
            // revert optimistic create
            entityMap.delete(type, id);
            optimisticMap.delete(type, id);
          } else {
            // revert optimistic update
            const { data, optimistic } = revertOptimisticUpdate(
              action.id,
              actionOptimisticEntity,
              actionEntityMap.get(type, id),
              entityMap.get(type, id),
              optimisticMap.get(type, id),
            );

            entityMap.set(type, id, data);
            if (optimistic) {
              optimisticMap.delete(type, id);
            } else {
              optimisticMap.set(type, id, optimistic);
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
            optimisticMap.get(type, id),
          );

          if (data) {
            entityMap.set(type, id, data);
          }
          optimisticMap.delete(type, id);
        });
      }

      // insertions/updates
      if (action.data && action.data.entities) {
        const actionEntityMap = new EntityMap(action.data.entities);
        const actionOptimisticEntityMap = new EntityMap(
          action.optimisticData && action.optimisticData.entities,
        );

        actionEntityMap.forEach(([actionEntity, type, id]) => {
          // Filter out fields that are also in optimistic entity
          const fields = filterOutOptimisticData(
            actionEntity,
            actionOptimisticEntityMap.get(type, id),
          );

          // Set entity data
          const data = entityMap.get(type, id);
          fields.forEach(field => {
            data[field] = actionEntity[field];
          });
          entityMap.set(type, id, data);
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
          entityMap.delete(type, id);
        });
      }

      return {
        data: entityMap.toObject(),
        optimistic: optimisticMap.toObject(),
      };
    }

    return state;
  };
}
