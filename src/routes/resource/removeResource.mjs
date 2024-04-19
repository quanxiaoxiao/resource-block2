import {
  Resource as ResourceModel,
  Block as BlockModel,
} from '../../models/index.mjs';

export default async (resourceItem) => {
  const now = Date.now();
  await Promise.all([
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
          timeInvalid: now,
        },
      },
    ),
    BlockModel.updateOne(
      {
        _id: resourceItem.block._id,
        linkCount: {
          $gt: 0,
        },
      },
      {
        $inc: { linkCount: -1 },
        timeUpdate: now,
      },
    ),
  ]);
};
