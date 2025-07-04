import { update } from '@quanxiaoxiao/list';
import createError from 'http-errors';

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
    if (findEntryOfAlias(nextItem.alias)) {
      throw createError(403);
    }
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
        icon: nextItem.icon,
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
