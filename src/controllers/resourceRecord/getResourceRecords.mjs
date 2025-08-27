import { ResourceRecord as ResourceRecordModel } from '#models.mjs';

export default async (resourceItem) => {
  const resourceRecordList = await ResourceRecordModel.aggregate([
    {
      $match: {
        resource: resourceItem._id,
        invalid: {
          $ne: true,
        },
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
