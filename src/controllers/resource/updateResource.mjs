import createError from 'http-errors';

import logger from '../../logger.mjs';
import {
  Entry as EntryModel,
  Resource as ResourceModel,
} from '../../models/index.mjs';
import getResourceById from './getResourceById.mjs';

export default async (resourceItem, input) => {
  const resourceItemNext = Object.assign({}, resourceItem.toObject?.() || resourceItem, input);
  const tempInstance = new ResourceModel(resourceItemNext);
  try {
    await tempInstance.validate();
  } catch (error) {
    throw createError(400, JSON.stringify(error.errors));
  }
  if (resourceItemNext.entry.toString() !== resourceItem.entry.toString()) {
    const entryItem = await EntryModel.findOne({
      _id: input.entry,
      invalid: {
        $ne: true,
      },
    });
    if (!entryItem) {
      throw createError(403, `\`${input.entry}\` entry not exist`);
    }
  }
  const modifiedCount = await ResourceModel.updateOne(
    {
      _id: resourceItem._id,
      invalid: {
        $ne: true,
      },
    },
    {
      $set: {
        ...input,
      },
    },
  );
  if (modifiedCount === 0) {
    throw createError(404);
  }
  logger.warn(`\`${resourceItem._id.toString()}\` updateResource \`${JSON.stringify(input)}\``);
  return getResourceById(resourceItem._id);
};
