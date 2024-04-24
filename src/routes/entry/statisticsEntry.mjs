import createError from 'http-errors';
import { isValidObjectId } from '@quanxiaoxiao/mongo';
import {
  Entry as EntryModel,
  Resource as ResourceModel,
} from '../../models/index.mjs';

export default async (entry) => {
  if (!isValidObjectId(entry)) {
    throw createError(404);
  }
  const entryItem = await EntryModel.findOne({
    invalid: {
      $ne: true,
    },
  });
  if (!entryItem) {
    throw createError(404);
  }
  const [data] = await ResourceModel.aggregate([
    {
      $match: {
        entry: entryItem._id,
        invalid: {
          $ne: true,
        },
      },
    },
    {
      $sort: {
        timeUpdate: -1,
      },
    },
    {
      $lookup: {
        from: 'blocks',
        localField: 'block',
        foreignField: '_id',
        as: 'blocks',
        pipeline: [
          {
            $limit: 1,
          },
        ],
      },
    },
    {
      $project: {
        entry: 1,
        timeUpdate: 1,
        size: {
          $first: '$blocks.size',
        },
      },
    },
    {
      $group: {
        _id: '$entry',
        timeUpdates: {
          $push: '$timeUpdate',
        },
        size: {
          $sum: '$size',
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        timeUpdate: {
          $first: '$timeUpdates',
        },
        size: 1,
        count: 1,
      },
    },
  ]);
  if (!data) {
    return {
      size: 0,
      count: 0,
      timeUpdate: null,
    };
  }
  return data;
};
