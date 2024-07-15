import store from '../store/store.mjs';
import formatDataState from '../utilities/formatDataState.mjs';
import resource from './resource/index.mjs';
import entry from './entry/index.mjs';

const { getState } = store;

export default {
  '/api/state': {
    get: (ctx) => {
      ctx.response = {
        data: formatDataState(getState()),
      };
    },
  },
  ...entry,
  ...resource,
};
