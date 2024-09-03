import { update } from '@quanxiaoxiao/list';
import store from '../../store/store.mjs';

const { dispatch, getState } = store;

export default (streamOutput, fn) => {
  const { streamOutputList } = getState();
  const ret = update(streamOutputList)(streamOutput, fn);
  if (!ret) {
    return null;
  }
  dispatch('streamOutputList', ret[2]);
  return ret[0];
};
