import crypto from 'node:crypto';
import assert from 'node:assert';
import { sort } from '@quanxiaoxiao/list';
import calcBlockPathname from '../../providers/calcBlockPathname.mjs';
import store from '../../store/store.mjs';

const { dispatch } = store;

export default ({
  resource,
  blockSize,
  block,
}) => {
  assert(typeof resource === 'string');
  const model = {
    _id: crypto.randomUUID(),
    resource,
    dateTimeCreate: Date.now(),
    chunkSize: 0,
    range: null,
    dateTimeActive: null,
    blockSize,
    pathname: calcBlockPathname(block),
  };

  dispatch('streamOutputList', (pre) => sort([...pre, model]));
  return model;
};
