import { update } from '@quanxiaoxiao/list';

import { dispatch,getState } from '../../store/store.mjs';

export default (streamOutput, fn) => {
  const { streamOutputList } = getState();
  const ret = update(streamOutputList)(streamOutput, fn);
  if (!ret) {
    return null;
  }
  dispatch('streamOutputList', ret[2]);
  return ret[0];
};
