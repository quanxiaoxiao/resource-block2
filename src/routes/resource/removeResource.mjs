import logger from '../../logger.mjs';
import {
  Resource as ResourceModel,
  Block as BlockModel,
} from '../../models/index.mjs';

export default async (resourceItem) => {
  const now = Date.now();
  await Promise.all([
    BlockModel.updateOne(
      {
        _id: resourceItem.block._id,
        linkCount: {
          $gt: 0,
        },
      },
      {
        $inc: { linkCount: -1 },
        dateTimeUpdate: now,
      },
    ),
    ResourceModel.updateOne(
      {
        _id: resourceItem._id,
        invalid: {
          $ne: true,
        },
      },
      {
        $set: {
          invalid: true,
          dateTimeInvalid: now,
        },
      },
    ),
  ]);
  logger.warn(`\`${resourceItem._id.toString()}\` removeResource`);
};
