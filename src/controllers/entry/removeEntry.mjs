import assert from 'node:assert';

import { remove } from '@quanxiaoxiao/list';

import logger from '../../logger.mjs';
import { Entry as EntryModel } from '../../models/index.mjs';
import { dispatch,getState } from '../../store/store.mjs';

export default (entry) => {
  assert(typeof entry === 'string');
  const { entryList } = getState();
  const ret = remove(entryList)(entry);
  if (!ret) {
    return null;
  }
  EntryModel.updateOne(
    {
      _id: entry,
      invalidAt: null,
    },
    {
      $set: {
        invalidAt: Date.now(),
      },
    },
  )
    .then(
      () => {
        logger.warn(`\`${entry}\` remove entry`);
      },
      (error) => {
        console.error(error);
      },
    );
  dispatch('entryList', ret[1]);
  return ret[0];
};
