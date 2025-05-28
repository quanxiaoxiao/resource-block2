import assert from 'node:assert';

import createError from 'http-errors';

import findEntry from '../../controllers/entry/findEntry.mjs';
import findEntryOfId from '../../controllers/entry/findEntryOfId.mjs';
import getResourceById from '../../controllers/resource/getResourceById.mjs';
import resourceType from '../../types/resource.mjs';
import resourceRecordType from '../../types/resourceRecord.mjs';
import getResourceRecords from './getResourceRecords.mjs';
import handleReadStreamBlock from './handleReadStreamBlock.mjs';
import handleStoreStreamBlockWithCreate from './handleStoreStreamBlockWithCreate.mjs';
import handleStoreStreamBlockWithUpdate from './handleStoreStreamBlockWithUpdate.mjs';
import queryResources from './queryResources.mjs';
import removeResource from './removeResource.mjs';
import updateResource from './updateResource.mjs';

const routers = {
  '/resource/:resource{/preview}': {
    onPre: async (ctx) => {
      if (ctx.request.method === 'PUT') {
        if (/\/preview$/.test(ctx.request.pathname)) {
          throw createError(404);
        }
        if (!ctx.signal.aborted) {
          await handleStoreStreamBlockWithUpdate(ctx);
        }
      }
    },
    put: async () => {},
    get: handleReadStreamBlock,
  },
  '/api/resource/:resource/records': {
    select: {
      type: 'array',
      properties: resourceRecordType,
    },
    get: async (ctx) => {
      const resourceItem = await getResourceById(ctx.request.params.resource);
      if (!resourceItem) {
        throw createError(404);
      }
      const list = await getResourceRecords(resourceItem._id);
      ctx.response = {
        data: list,
      };
    },
  },
  '/api/resource/:resource': {
    select: {
      type: 'object',
      properties: resourceType,
    },
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
            return 'dateTimeCreate';
          }
          return v;
        },
      },
    },
    match: {
      'query.order': { $in: [-1, 1] },
      'query.orderBy': {
        $in: [
          'dateTimeCreate',
          'dateTimeUpdate',
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
  '/upload{/:entry}': {
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
        throw createError(404);
      }
      if (entryItem.readOnly) {
        throw createError(403, `\`${entry}\` entry is read only`);
      }
      ctx.entryItem = entryItem;
      if (ctx.request.method === 'POST' && !ctx.signal.aborted) {
        if (ctx.socket.writable
          && ctx.request.headers['expect']
          && ctx.request.headers['expect'].toString().toLowerCase() === '100-continue') {
          ctx.socket.write('HTTP/1.1 100 Continue\r\n\r\n');
        }
        await handleStoreStreamBlockWithCreate(ctx);
      }
    },
    post: () => {},
  },
};

export default Object
  .keys(routers)
  .reduce((acc, pathname) => {
    const handler = routers[pathname];
    return {
      ...acc,
      [pathname]: {
        ...handler,
        onPre: async (ctx) => {
          if (ctx.request.params && ctx.request.params.resource) {
            const resourceItem = await getResourceById(ctx.request.params.resource);
            assert(!ctx.signal.aborted);
            if (!resourceItem) {
              throw createError(404);
            }
            const entryItem = findEntryOfId(resourceItem.entry.toString());
            if (!entryItem) {
              throw createError(404);
            }
            if (ctx.request.method !== 'GET' && entryItem.readOnly) {
              throw createError(403, 'entry is read only');
            }
            ctx.entryItem = entryItem;
            ctx.resourceItem = resourceItem;
          }

          if (handler.onPre) {
            await handler.onPre(ctx);
            assert(!ctx.socket.destroyed);
            assert(!ctx.signal.aborted);
          }
        },
      },
    };
  }, {});
