import assert from 'node:assert';

import { update } from '@quanxiaoxiao/list';

import { Entry as EntryModel } from '../../models/index.mjs';
import { dispatch,getState } from '../../store/store.mjs';
import findEntryOfAlias from './findEntryOfAlias.mjs';

export default (entry, fn) => {
  const { entryList } = getState();
  const ret = update(entryList)(entry, fn);
  if (!ret) {
    return null;
  }
  const nextItem = ret[0];
  const preItem = ret[1];
  if (nextItem.alias !== preItem.alias && nextItem.alias) {
    assert(!findEntryOfAlias(nextItem.alias));
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
        name: nextItem.name,
        alias: nextItem.alias,
        order: nextItem.order,
        description: nextItem.description,
        readOnly: nextItem.readOnly,
      },
    },
  )
    .then(
      () => {},
      (error) => {
        console.error(error);
      },
    );
  dispatch('entryList', ret[2]);
  return nextItem;
};
