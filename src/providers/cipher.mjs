import {
  createCipheriv,
  createDecipheriv,
} from 'node:crypto';
import store from '../store/store.mjs';

const { getState } = store;

const incrementBuffer = (buf, counter) => {
  const len = buf.length;
  let i = len - 1;
  while (counter !== 0) {
    const mod = (counter + buf[i]) % 256;
    counter = Math.floor((counter + buf[i]) / 256); // eslint-disable-line no-param-reassign
    buf[i] = mod; // eslint-disable-line no-param-reassign
    i -= 1;
    if (i < 0) {
      i = len - 1;
    }
  }

  return buf;
};

export const hmacSha256 = (buf) => {
  const { secret } = getState().cipher;
  return crypto.createHmac('sha256', secret).update(buf).digest();
};

export const calcKey = (blockItem) => hmacSha256([
  blockItem.size,
  blockItem.sha256,
  blockItem._id.toString(),
].join(':'));

export const calcIV = (blockItem) => hmacSha256(Buffer.from(blockItem._id.toString())).slice(-16);

export const encrypt = (blockItem) => {
  const { algorithm } = getState().cipher;
  const iv = calcIV(blockItem);
  const key = calcKey(blockItem);
  const cipher = createCipheriv(algorithm, key, iv);
  return cipher;
};

export const decrypt = (blockItem, counter = 0) => {
  const { algorithm } = getState().cipher;
  const iv = calcIV(blockItem);
  const key = calcKey(blockItem);
  const decipher = createDecipheriv(algorithm, key, incrementBuffer(iv, counter));
  return decipher;
};
