import { find } from '@quanxiaoxiao/list';
import store from '../../store/store.mjs';

const { getState } = store;

export default (streamOutput) => {
  const { streamOutputList } = getState();
  return find(streamOutputList)(streamOutput);
};
