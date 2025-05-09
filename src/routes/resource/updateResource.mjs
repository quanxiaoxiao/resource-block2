import { isValidObjectId } from '@quanxiaoxiao/mongo';
import createError from 'http-errors';

import getResourceById from '../../controllers/resource/getResourceById.mjs';
import logger from '../../logger.mjs';
import {
  Entry as EntryModel,
  Resource as ResourceModel,
} from '../../models/index.mjs';

export default async (resourceItem, input) => {
  if (Object.hasOwnProperty.call(input, 'name')
    && (!input.name || input.name.trim() === '')
  ) {
    throw createError(400, 'resource name is empty');
  }
  if (Object.hasOwnProperty.call(input, 'entry')) {
    if (!isValidObjectId(input.entry)) {
      throw createError(403, `\`${input.entry}\` entry not exist`);
    }
    if (input.entry !== resourceItem.entry.toString()) {
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
  }
  await ResourceModel.updateOne(
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
  logger.warn(`\`${resourceItem._id.toString()}\` updateResource \`${JSON.stringify(input)}\``);
  return getResourceById(resourceItem._id);
};
