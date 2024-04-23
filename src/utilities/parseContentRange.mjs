import assert from 'node:assert';
import createError from 'http-errors';

const calcNumber = (str) => {
  const s = str.trim();
  const n = parseInt(s, 10);
  if (Number.isNaN(n) || s !== `${n}` || n < 0) {
    throw createError(400);
  }
  return n;
};

export default (str, size) => {
  assert(size >= 0);
  const reg = /bytes=([^-]+)-(\d*)$/i;
  const matches = str.match(reg);
  if (!matches) {
    throw createError(400);
  }
  let [, start, end] = matches;
  start = calcNumber(start);
  if (start >= size) {
    throw createError(416);
  }
  if (!end || end.trim() === '') {
    end = size - 1;
  } else {
    end = calcNumber(end);
    if (end >= size) {
      throw createError(400);
    }
  }

  if (start > end) {
    throw createError(400);
  }
  return [start, end];
};
