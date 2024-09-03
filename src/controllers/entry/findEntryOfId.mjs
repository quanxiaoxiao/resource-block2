import assert from 'node:assert';
import { find } from '@quanxiaoxiao/list';
import store from '../../store/store.mjs';

const { getState } = store;

export default (entry) => {
  assert(typeof entry === 'string');
  const { entryList } = getState();
  return find(entryList)(entry);
};
