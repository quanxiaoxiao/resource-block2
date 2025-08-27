import { getQuery, isValidObjectId } from '@quanxiaoxiao/mongo';
import { escapeString } from '@quanxiaoxiao/utils';
import createError from 'http-errors';
import mongoose from 'mongoose';

import {
  Entry as EntryModel,
  Resource as ResourceModel,
} from '#models.mjs';

export default async ({
  limit,
  skip,
  entry,
  orderBy,
  order,
  keywords,
  category,
  ...args
}) => {
  const entryItem = await EntryModel.findOne({
    invalid: {
      $ne: true,
    },
    ...isValidObjectId(entry)
      ? {
        _id: new mongoose.Types.ObjectId(entry),
      }
      : {
        alias: entry,
      },
  });
  if (!entryItem) {
    throw createError(404);
  }
  const query = getQuery(args);
  query.invalid = {
    $ne: true,
  };
  if (category) {
    query.categories = {
      $in: [category],
    };
  }
  if (keywords) {
    if (keywords[0] === '/') {
      if (keywords.length > 1) {
        const reg = new RegExp(keywords.slice(1), 'i');
        query.$or = [
          {
            description: reg,
          },
          {
            name: reg,
          },
        ];
      }
    } else {
      const reg = new RegExp(escapeString(keywords), 'i');
      query.$or = [
        {
          description: reg,
        },
        {
          name: reg,
        },
      ];
    }
  }

  query.entry = entryItem._id;

  const orderAt = {};

  if (orderBy === 'dateTimeUpdate') {
    orderAt.dateTimeUpdate = order;
  } else if (orderBy === 'size') {
    orderAt.blockSize = order;
    orderAt.dateTimeUpdate = -1;
  } else {
    orderAt[orderBy] = order;
    orderAt.dateTimeUpdate = -1;
  }

  const [list, count] = await Promise.all([
    ResourceModel.aggregate([
      ...(orderBy === 'size' || orderBy === 'dateTimeAccess') ? [] : [
        {
          $sort: orderAt,
        },
      ],
      {
        $match: query,
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
        $lookup: {
          from: 'resourcerecords',
          localField: 'record',
          foreignField: '_id',
          as: 'record',
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
        $unwind: '$record',
      },
      {
        $addFields: {
          blockSize: '$block.size',
        },
      },
      {
        $addFields: {
          dateTimeAccess: '$record.dateTimeAccess',
        },
      },
      ...(orderBy === 'size' || orderBy === 'dateTimeAccess') ? [
        {
          $sort: orderAt,
        },
      ] : [],
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]),
    ResourceModel.countDocuments(query),
  ]);

  return {
    count,
    list,
  };
};
