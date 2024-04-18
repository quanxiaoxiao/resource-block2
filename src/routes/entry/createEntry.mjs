import createError from 'http-errors';
import { Entry as EntryModel } from '../../models/index.mjs';

export default async (input) => {
  const data = {
    ...input,
  };
  if (typeof data.alias === 'string' && data.alias.trim() !== '') {
    const matched = await EntryModel.findOne({
      alias: data.alias.trim(),
      invalid: {
        $ne: true,
      },
    });
    if (matched) {
      throw createError(403, `\`${matched.alias}\` alias alreay set`);
    }
  }
  const entryItem = new EntryModel(data);
  await entryItem.save();
  return entryItem;
};
