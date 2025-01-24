import createError from 'http-errors';
import mongoose from 'mongoose';

import findEntryOfId from '../../controllers/entry/findEntryOfId.mjs';
import { Resource as ResourceModel } from '../../models/index.mjs';

export default async (entry) => {
  const entryItem = findEntryOfId(entry);
  if (!entryItem) {
    throw createError(404);
  }
  const [data] = await ResourceModel.aggregate([
    {
      $match: {
        entry: new mongoose.Types.ObjectId(entryItem._id),
        invalidAt: null,
      },
    },
    {
      $sort: {
        dateTimeUpdate: -1,
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
        dateTimeUpdate: 1,
        size: {
          $first: '$blocks.size',
        },
      },
    },
    {
      $group: {
        _id: '$entry',
        dateTimeUpdates: {
          $push: '$dateTimeUpdate',
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
        dateTimeUpdate: {
          $first: '$dateTimeUpdate',
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
      dateTimeUpdate: null,
    };
  }
  return data;
};
