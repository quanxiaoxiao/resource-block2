import { Readable } from 'node:stream';
import createError from 'http-errors';
import { readStream } from '@quanxiaoxiao/httttp';
import resourceType from '../../types/resource.mjs';
import findEntry from '../../controllers/entry/findEntry.mjs';
import queryResources from './queryResources.mjs';
import removeResource from './removeResource.mjs';
import updateResource from './updateResource.mjs';
import checkoutResource from './checkoutResource.mjs';
import handleStoreStreamBlockWithCreate from './handleStoreStreamBlockWithCreate.mjs';
import handleStoreStreamBlockWithUpdate from './handleStoreStreamBlockWithUpdate.mjs';
import handleReadStreamBlock from './handleReadStreamBlock.mjs';

export default {
  '/resource/:_id{/preview}?': {
    select: {
      type: 'object',
      properties: resourceType,
    },
    onPre: async (ctx) => {
      await checkoutResource(ctx);
      if (ctx.request.method === 'PUT') {
        if (ctx.request.params[0] === 'preview') {
          throw createError(404);
        }
        if (!ctx.signal.aborted) {
          await handleStoreStreamBlockWithUpdate(ctx);
        }
      }
    },
    put: async (ctx) => {
      if (ctx.response
        && ctx.response.body instanceof Readable
        && ctx.response.body.readable
        && !ctx.signal.aborted
      ) {
        const buf = await readStream(ctx.response.body, ctx.signal);
        ctx.response.data = JSON.parse(buf);
      }
    },
    get: handleReadStreamBlock,
  },
  '/api/resource/:_id': {
    select: {
      type: 'object',
      properties: resourceType,
    },
    onPre: checkoutResource,
    get: (ctx) => {
      ctx.response = {
        data: ctx.resourceItem,
      };
    },
    delete: async (ctx) => {
      await removeResource(ctx.resourceItem);
      ctx.response = {
        data: ctx.resourceItem,
      };
    },
    put: {
      validate: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            not: {
              pattern: '^\\s+$',
            },
          },
          mime: {
            type: 'string',
            nullable: true,
          },
          entry: {
            type: 'string',
            minLength: 1,
          },
          category: {
            type: 'string',
            nullable: true,
          },
          description: {
            type: 'string',
            nullable: true,
          },
        },
        additionalProperties: false,
      },
      fn: async (ctx) => {
        const resourceItem = await updateResource(ctx.resourceItem, ctx.request.data);
        ctx.response = {
          data: resourceItem,
        };
      },
    },
  },
  '/api/entry/:entry/resources': {
    onPre: async (ctx) => {
      const entryItem = findEntry(ctx.request.params.entry);
      if (!entryItem) {
        throw createError(404);
      }
      ctx.entryItem = entryItem;
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
  '/upload{/:entry}?': {
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
      const entryItem = findEntry(entry);
      if (!entryItem) {
        throw createError(403, `\`${entry}\` entry is not exist`);
      }
      if (entryItem.readOnly) {
        throw createError(403, `\`${entry}\` entry is read only`);
      }
      ctx.entryItem = entryItem;
      if (ctx.request.method === 'POST' && !ctx.signal.aborted) {
        await handleStoreStreamBlockWithCreate(ctx);
      }
    },
    post: () => {},
  },
};
