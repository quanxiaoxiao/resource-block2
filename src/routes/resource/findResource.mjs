import assert from 'node:assert';

import { isValidObjectId } from '@quanxiaoxiao/mongo';
import createError from 'http-errors';

import { Resource as ResourceModel } from '../../models/index.mjs';

export default async (resource) => {
  if (!isValidObjectId(resource)) {
    throw createError(404);
  }
  const resourceItem = await ResourceModel
    .findOne({
      _id: resource,
      invalid: {
        $ne: true,
      },
    })
    .populate({
      path: 'block',
    })
    .populate({
      path: 'record',
    })
    .lean();

  if (!resourceItem || !resourceItem.block) {
    return null;
  }
  assert(resourceItem.block.linkCount > 0);
  return resourceItem;
};
