import assert from 'node:assert';

import { find } from '@quanxiaoxiao/list';

import { getValue } from '../../store/store.mjs';

export default (entry) => {
  assert(typeof entry === 'string');
  const entryList = getValue('entryList');
  return find(entryList)(entry);
};
