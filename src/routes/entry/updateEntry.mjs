import createError from 'http-errors';
import { Entry as EntryModel } from '../../models/index.mjs';

export default async (entryItem, input) => {
  const data = {
    ...input,
  };
  if (typeof data.alias === 'string') {
    data.alias = data.alias.trim();
  }
  if (data.alias
    && data.alias !== entryItem.alias
  ) {
    const matched = await EntryModel.findOne({
      _id: {
        $ne: entryItem._id,
      },
      alias: data.alias,
      invalid: {
        $ne: true,
      },
    });
    if (matched) {
      throw createError(403, `\`${data.alias}\` alias alreay set`);
    }
  }
  const entryItemNext = await EntryModel
    .findOneAndUpdate(
      {
        _id: entryItem._id,
        invalid: {
          $ne: true,
        },
      },
      {
        $set: {
          ...data,
        },
      },
      {
        new: true,
      },
    )
    .lean();
  if (!entryItemNext) {
    throw createError(404);
  }
  return entryItemNext;
};
