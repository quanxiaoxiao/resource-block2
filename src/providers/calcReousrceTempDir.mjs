import assert from 'node:assert';
import path from 'node:path';
import { isValidObjectId } from '@quanxiaoxiao/mongo';
import store from '../store/store.mjs';

const { getState } = store;

export default (block) => {
  assert(isValidObjectId(block));
  return path.resolve(getState().block.tempDir, block.toString());
};
