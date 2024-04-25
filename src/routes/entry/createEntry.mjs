import createError from 'http-errors';
import logger from '../../logger.mjs';
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
  logger.warn(`\`${entryItem._id.toString()}\` createEntry \`${JSON.stringify(data)}\``);
  await entryItem.save();
  return entryItem.toObject();
};
