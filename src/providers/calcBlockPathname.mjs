import assert from 'node:assert';
import crypto from 'node:crypto';
import path from 'node:path';

import { isValidObjectId } from '@quanxiaoxiao/mongo';

import { getState } from '../store/store.mjs';

export default (block) => {
  assert(isValidObjectId(block));
  const blockId = block.toString();
  const sha256 = crypto.createHash('sha256').update(blockId).digest('hex');
  const dir = sha256.slice(0, 2);
  const fileName = sha256.slice(2);
  return path.resolve(
    getState().block.dir,
    dir,
    fileName,
  );
};
