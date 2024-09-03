import assert from 'node:assert';
import { find } from '@quanxiaoxiao/list';
import store from '../../store/store.mjs';

const { getState } = store;

export default (streamInput) => {
  assert(typeof streamInput === 'string');
  const { streamInputList } = getState();
  return find(streamInputList)(streamInput);
};
