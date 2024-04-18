import createError from 'http-errors';
import { isValidObjectId } from '@quanxiaoxiao/mongo';
import { Entry as EntryModel } from '../../models/index.mjs';

export default async (entry) => {
  const query = {
    invalid: {
      $ne: true,
    },
  };
  if (isValidObjectId(entry)) {
    query._id = entry;
  } else {
    query.alias = entry;
  }
  const entryItem = await EntryModel.findOne(query);
  if (!entryItem) {
    throw createError(404);
  }
  return entryItem;
};
