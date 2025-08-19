import assert from 'node:assert';

import { remove } from '@quanxiaoxiao/list';

import logger from '#logger.mjs';
import { Entry as EntryModel } from '#models.mjs';
import { dispatch, getValue } from '#store.mjs';

export default (entry) => {
  assert(typeof entry === 'string');
  const entryList = getValue('entryList');
  const ret = remove(entryList)(entry);
  if (!ret) {
    return null;
  }
  EntryModel.updateOne(
    {
      _id: entry,
      invalid: {
        $ne: true,
      },
    },
    {
      $set: {
        invalid: true,
        dateTimeInvalid: Date.now(),
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
