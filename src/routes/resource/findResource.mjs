import createError from 'http-errors';
import { isValidObjectId } from '@quanxiaoxiao/mongo';
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
  return resourceItem;
};
