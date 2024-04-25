import createError from 'http-errors';
import { isValidObjectId } from '@quanxiaoxiao/mongo';
import logger from '../../logger.mjs';
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
    .lean();

  if (!resourceItem || !resourceItem.block) {
    throw createError(404);
  }
  if (resourceItem.block.linkCount === 0) {
    logger.warn(`\`${resource}\` resource block link count is 0`);
    throw createError(500);
  }
  return resourceItem;
};
