import createError from 'http-errors';
import resourceType from '../../types/resource.mjs';
import { selectEntry } from '../../store/selector.mjs';
import createResource from './createResource.mjs';
import queryResources from './queryResources.mjs';
import handleResourceStreamReceive from './handleResourceStreamReceive.mjs';
import findResource from './findResource.mjs';

export default {
  '/api/resource/:_id': {
    select: {
      type: 'object',
      properties: resourceType,
    },
    onPre: async (ctx) => {
      const resourceItem = await findResource(ctx.request.params._id);
      if (!resourceItem) {
        throw createError(404);
      }
      const entryItem = selectEntry(resourceItem.entry);
      if (!entryItem) {
        throw createError(404);
      }
      ctx.resourceItem = resourceItem;
    },
    get: (ctx) => {
      ctx.response = {
        data: ctx.resourceItem,
      };
    },
  },
  '/api/:entry/resources': {
    onPre: async (ctx) => {
      const entryItem = selectEntry(ctx.request.params.entry);
      if (!entryItem) {
        throw createError(404);
      }
    },
    select: {
      type: 'object',
      properties: {
        count: {
          type: 'integer',
        },
        list: {
          type: 'array',
          properties: resourceType,
        },
      },
    },
    query: {
      limit: {
        type: 'integer',
        resolve: (v) => {
          if (!v) {
            return 30;
          }
          return v;
        },
      },
      skip: {
        type: 'integer',
        resolve: (v) => {
          if (!v) {
            return 0;
          }
          return v;
        },
      },
      order: {
        type: 'integer',
        resolve: (v) => {
          if (!v) {
            return -1;
          }
          return v;
        },
      },
      keywords: {
        type: 'string',
      },
      orderBy: {
        type: 'string',
        resolve: (v) => {
          if (!v) {
            return 'timeCreate';
          }
          return v;
        },
      },
    },
    match: {
      'query.order': { $in: [-1, 1] },
      'query.orderBy': {
        $in: [
          'timeCreate',
          'timeUpdate',
          'size',
          'mime',
          'name',
          'category',
        ],
      },
      'query.limit': { $gt: 0 },
      'query.skip': { $gte: 0 },
    },
    get: async (ctx) => {
      const { count, list } = await queryResources({
        entry: ctx.request.params.entry,
        ...ctx.request.query,
      });
      ctx.response = {
        data: {
          count,
          list,
        },
      };
    },
  },
  '/upload/:entry?': {
    select: {
      type: 'object',
      properties: resourceType,
    },
    query: {
      name: {
        type: 'string',
        resolve: (v) => {
          if (!v) {
            return '';
          }
          return v;
        },
      },
    },
    onPre: async (ctx) => {
      const entry = ctx.request.params.entry || 'default';
      const entryItem = selectEntry(entry);
      if (!entryItem) {
        throw createError(403, `\`${entry}\` entry is not exist`);
      }
      ctx.entryItem = entryItem;
    },
    post: {
      fn: handleResourceStreamReceive,
      onRequestEnd: async (ctx) => {
        ctx.blockItem.sha256 = ctx.hash.digest('hex');
        const resourceItem = await createResource({
          name: ctx.request.query.name,
          pathname: ctx.resourcePathname,
          entry: ctx.entryItem._id,
          blockData: ctx.blockItem,
        });
        ctx.response = {
          data: resourceItem,
        };
      },
    },
  },
};
