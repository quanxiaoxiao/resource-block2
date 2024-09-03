import { remove } from '@quanxiaoxiao/list';
import store from '../../store/store.mjs';

const { dispatch, getState } = store;

export default (streamOutput) => {
  const { streamOutputList } = getState();
  const ret = remove(streamOutputList)(streamOutput);
  if (!ret) {
    return null;
  }
  dispatch('streamOutputList', ret[1]);
  return ret[0];
};
