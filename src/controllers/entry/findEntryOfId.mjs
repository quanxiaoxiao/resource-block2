import assert from 'node:assert';

import { find } from '@quanxiaoxiao/list';

import { getState } from '../../store/store.mjs';

export default (entry) => {
  assert(typeof entry === 'string');
  const { entryList } = getState();
  return find(entryList)(entry);
};
