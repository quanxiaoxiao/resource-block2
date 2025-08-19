import { remove } from '@quanxiaoxiao/list';
import shelljs from 'shelljs';

import { dispatch,getState } from '#store.mjs';

export default (streamInput) => {
  const { streamInputList } = getState();
  const ret = remove(streamInputList)(streamInput);
  if (!ret) {
    return null;
  }
  process.nextTick(() => {
    if (shelljs.test('-f', ret[0].pathname)) {
      shelljs.rm(ret[0].pathname);
    }
  });
  dispatch('streamInputList', ret[1]);
  return ret[0];
};
