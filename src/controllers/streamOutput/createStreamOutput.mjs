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
  resourceRecord,
}) => {
  assert(typeof resource === 'string');
  assert(typeof resourceRecord === 'string');
  const model = {
    _id: crypto.randomUUID(),
    resource,
    dateTimeCreate: Date.now(),
    chunkSize: 0,
    range: null,
    dateTimeActive: null,
    blockSize,
    pathname: calcBlockPathname(block),
    resourceRecord,
  };

  dispatch('streamOutputList', (pre) => sort([...pre, model]));
  return model;
};
