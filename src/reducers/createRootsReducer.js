import hasManyEntities from '../utils/hasManyEntities';
import prependEntities from './utils/prependEntities';
import appendEntities from './utils/appendEntities';
import detachEntities from './utils/detachEntities';
import {
  throwUpdateRootConnectionError,
  throwWrongRootConnectionFormatError,
  throwWrongManyRootConnectionFormatError,
} from './utils/handleErrors';

export default function createReducer(roots) {
  const initialState = roots;

  return function reducer(state = initialState, baseAction) {
    if (
      (baseAction.type === 'TRANSPORTER_REQUEST_START' ||
        baseAction.type === 'TRANSPORTER_REQUEST_COMPLETED') &&
      baseAction.actions.roots &&
      baseAction.actions.roots.length > 0
    ) {
      const nextState = { ...state };

      baseAction.actions.roots.forEach((action) => {
        switch (action.type) {
          // apply response
          case 'APPLY_RESPONSE': {
            Object.keys(action.data).forEach((name) => {
              if (nextState[name] && nextState[name].linked) {
                nextState[name].linked = nextState[name].linked.concat(action.data[name].linked);
              } else {
                nextState[name] = {
                  linked: action.data[name].linked,
                };
              }
            });
            break;
          }
          // update connection
          case 'UPDATE_CONNECTION': {
            const { name, linkedEntity } = action;

            // error checks
            if (!nextState[name]) {
              throwUpdateRootConnectionError(name);
            }
            if (nextState[name].linked && hasManyEntities(nextState[name].linked)) {
              throwWrongRootConnectionFormatError(name);
            }

            nextState[name].linked = linkedEntity;
            break;
          }
          // update many connection
          case 'UPDATE_MANY_CONNECTION': {
            const { name, linkedEntities } = action;

            // error checks
            if (!nextState[name]) {
              throwUpdateRootConnectionError(name);
            }
            if (nextState[name].linked && !hasManyEntities(nextState[name].linked)) {
              throwWrongManyRootConnectionFormatError(name);
            }

            switch (action.method) {
              case 'sync_prepend': {
                nextState[name].linked = prependEntities(
                  linkedEntities,
                  nextState[name].linked,
                  true,
                );
                break;
              }
              case 'sync_append': {
                nextState[name].linked = appendEntities(
                  linkedEntities,
                  nextState[name].linked,
                  true,
                );
                break;
              }
              case 'prepend': {
                nextState[name].linked = prependEntities(linkedEntities, nextState[name].linked);
                break;
              }
              case 'append': {
                nextState[name].linked = appendEntities(linkedEntities, nextState[name].linked);
                break;
              }
              case 'detach': {
                nextState[name].linked = detachEntities(linkedEntities, nextState[name].linked);
                break;
              }
              default: {
                // do nothing
              }
            }
            break;
          }
          default: {
            // do nothing
          }
        }
      });

      return nextState;
    }

    return state;
  };
}
