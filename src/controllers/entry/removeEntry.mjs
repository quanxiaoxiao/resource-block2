import assert from 'node:assert';
import { remove } from '@quanxiaoxiao/list';
import logger from '../../logger.mjs';
import { Entry as EntryModel } from '../../models/index.mjs';
import store from '../../store/store.mjs';

const { dispatch, getState } = store;

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
      invalid: {
        $ne: true,
      },
    },
    {
      $set: {
        invalid: true,
        timeInvalid: Date.now(),
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
