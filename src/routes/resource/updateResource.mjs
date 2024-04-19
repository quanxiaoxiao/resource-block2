import createError from 'http-errors';
import { isValidObjectId } from '@quanxiaoxiao/mongo';
import {
  Resource as ResourceModel,
  Entry as EntryModel,
} from '../../models/index.mjs';
import findResource from './findResource.mjs';

export default async (resourceItem, input) => {
  if (Object.hasOwnProperty.call(input, 'name')
    && (!input.name || input.name.trim() === '')
  ) {
    throw createError(400);
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
  return findResource(resourceItem._id);
};
