import mongoose from 'mongoose';

import { ResourceRecord as ResourceRecordModel } from '../../models/index.mjs';

export default async (resource) => {
  const resourceRecordList = await ResourceRecordModel.aggregate([
    {
      $match: {
        resource: new mongoose.Types.ObjectId(resource),
        invalidAt: null,
      },
    },
    {
      $lookup: {
        from: 'blocks',
        localField: 'block',
        foreignField: '_id',
        as: 'block',
        pipeline: [
          {
            $limit: 1,
          },
        ],
      },
    },
    {
      $unwind: '$block',
    },
    {
      $sort: {
        dateTimeCreate: -1,
      },
    },
  ]);

  return resourceRecordList;
};
