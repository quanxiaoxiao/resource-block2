import assert from 'node:assert';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
} from 'node:crypto';

import { isValidObjectId } from '@quanxiaoxiao/mongo';

import { getState } from '../store/store.mjs';

const incrementBuffer = (buf, counter) => {
  const len = buf.length;
  let i = len - 1;
  while (counter !== 0) {
    const mod = (counter + buf[i]) % 256;
    counter = Math.floor((counter + buf[i]) / 256);
    buf[i] = mod;
    i -= 1;
    if (i < 0) {
      i = len - 1;
    }
  }

  return buf;
};

export const hmacSha256 = (buf) => {
  const { secret } = getState().cipher;
  return createHmac('sha256', secret).update(buf).digest();
};

export const calcKey = (block) => hmacSha256(Buffer.from(block));

export const calcIV = (block) => Buffer.from(block).slice(-16);

export const encrypt = (block) => {
  assert(isValidObjectId(block));
  const { algorithm } = getState().cipher;
  const blockId = block.toString();
  const key = calcKey(blockId);
  const iv = calcIV(blockId);
  const cipher = createCipheriv(algorithm, key, iv);
  return cipher;
};

export const decrypt = (block, counter = 0) => {
  assert(isValidObjectId(block));
  const blockId = block.toString();
  const { algorithm } = getState().cipher;
  const iv = calcIV(blockId);
  const key = calcKey(blockId);
  const decipher = createDecipheriv(algorithm, key, incrementBuffer(iv, counter));
  return decipher;
};
