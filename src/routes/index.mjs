import fs from 'node:fs';
import path from 'node:path';

import { toDataify } from '@quanxiaoxiao/node-utils';

import { getState } from '../store/store.mjs';
import entry from './entry/index.mjs';
import resource from './resource/index.mjs';

export default {
  '/api/state': {
    put: (ctx) => {
      fs.writeFileSync(path.resolve(process.cwd(), '.state.json'), toDataify(getState()));
      ctx.response = {
        data: Date.now(),
      };
    },
  },
  ...entry,
  ...resource,
};
