import path from 'node:path';
import shelljs from 'shelljs';
import store from '../store/store.mjs';

const { getState } = store;

export default () => {
  const blockDir = getState().block.dir;
  for (let i = 0; i <= 255; i++) {
    const dirname = i.toString('16').padStart(2, '0');
    const pathname = path.join(blockDir, dirname);
    if (!shelljs.test('-d', pathname)) {
      shelljs.mkdir('-p', pathname);
    }
  }
};
