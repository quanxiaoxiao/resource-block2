import path from 'node:path';

import shelljs from 'shelljs';

import { getState } from '../store/store.mjs';

export default () => {
  const blockDir = getState().block.dir;
  const tempDir = getState().block.tempDir;
  if (!shelljs.test('-d', tempDir)) {
    shelljs.mkdir('-p', tempDir);
  }
  for (let i = 0; i <= 255; i++) {
    const dirname = i.toString('16').padStart(2, '0');
    const pathname = path.join(blockDir, dirname);
    if (!shelljs.test('-d', pathname)) {
      shelljs.mkdir('-p', pathname);
    }
  }
};
