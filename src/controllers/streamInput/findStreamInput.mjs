import assert from 'node:assert';

import { find } from '@quanxiaoxiao/list';

import { getState } from '../../store/store.mjs';

export default (streamInput) => {
  assert(typeof streamInput === 'string');
  const { streamInputList } = getState();
  return find(streamInputList)(streamInput);
};
