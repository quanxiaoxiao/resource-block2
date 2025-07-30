import assert from 'node:assert';

import { sort } from '@quanxiaoxiao/list';
import mongoose from 'mongoose';

import logger from '../../logger.mjs';
import { Entry as EntryModel } from '../../models/index.mjs';
import { dispatch, getValue } from '../../store/store.mjs';
import findEntryOfAlias from './findEntryOfAlias.mjs';

export default ({
  alias,
  name,
  icon,
  description = '',
  readOnly = false,
}) => {
  const entryList = getValue('entryList');
  const model = {
    _id: new mongoose.Types.ObjectId().toString(),
    alias: (alias ?? '').trim(),
    name,
    icon,
    order: entryList.length,
    description,
    dateTimeCreate: Date.now(),
    readOnly,
  };

  if (model.alias) {
    assert(!findEntryOfAlias(model.alias));
  }

  const entryItem = new EntryModel({
    ...model,
  });

  entryItem
    .save()
    .then(
      () => {
        logger.warn(`create entry \`${JSON.stringify(model)}\``);
      },
      (error) => {
        console.error(error);
      },
    );

  dispatch('entryList', (pre) => sort([...pre, model]));

  return model;
};
