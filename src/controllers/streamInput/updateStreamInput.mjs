import { update } from '@quanxiaoxiao/list';

import { dispatch,getState } from '#store.mjs';

export default (streamInput, fn) => {
  const { streamInputList } = getState();
  const ret = update(streamInputList)(streamInput, fn);
  if (!ret) {
    return null;
  }
  dispatch('streamInputList', ret[2]);
  return ret[0];
};
