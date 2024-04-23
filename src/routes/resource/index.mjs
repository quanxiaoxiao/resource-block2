import fs from 'node:fs/promises';
import createError from 'http-errors';
import { select } from '@quanxiaoxiao/datav';
import { waitFor } from '@quanxiaoxiao/utils';
import resourceType from '../../types/resource.mjs';
import { selectEntry } from '../../store/selector.mjs';
import handleResourceStreamReceive from './handleResourceStreamReceive.mjs';
import createResource from './createResource.mjs';
import queryResources from './queryResources.mjs';
import findResource from './findResource.mjs';
import removeResource from './removeResource.mjs';
import updateResource from './updateResource.mjs';
import getResourceBlockStream from './getResourceBlockStream.mjs';
import updateResourceByBlock from './updateResourceByBlock.mjs';

const checkoutResource = async (ctx) => {
  const resourceItem = await findResource(ctx.request.params._id);
  if (!resourceItem) {
    throw createError(404);
  }
  const entryItem = selectEntry(resourceItem.entry);
  if (!entryItem) {
    throw createError(404);
  }
  ctx.resourceItem = resourceItem;
};

export default {
  '/resource/:_id/(preview)?': {
    onPre: checkoutResource,
    put: {
      fn: (ctx) => {
        if (ctx.request.params[0] === 'preview') {
          throw createError(404);
        }
        return handleResourceStreamReceive(ctx);
      },
      onRequestEnd: async (ctx) => {
        ctx.blockItem.sha256 = ctx.hash.digest('hex');
        await waitFor(50);
        if (ctx.blockItem.sha256 === ctx.resourceItem.block.sha256) {
          await fs.unlink(ctx.pathname);
          ctx.response = {
            data: select({
              type: 'object',
              properties: resourceType,
            })(ctx.resourceItem),
          };
        } else {
          const resourceItem = await updateResourceByBlock(
            ctx.resourceItem,
            {
              pathname: ctx.resourcePathname,
              blockData: ctx.blockItem,
            },
          );
          ctx.response = {
            data: select({
              type: 'object',
              properties: resourceType,
            })(resourceItem),
          };
        }
      },
    },
    get: {
      fn: (ctx) => {
        ctx.response = {
          headers: {},
          body: getResourceBlockStream(ctx.resourceItem),
        };
        const resourceName = ctx.resourceItem.name || ctx.resourceItem._id.toString();
        if (ctx.request.params[0] === 'preview') {
          if (ctx.resourceItem.mime) {
            ctx.response.headers['content-type'] = ctx.resourceItem.mine;
          }
          ctx.response.headers['content-disposition'] = `inline; filename=${resourceName}`;
        } else {
          ctx.response.headers['content-disposition'] = `attachment; filename="${resourceName}"`;
        }
      },
    },
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
        additionalProperties: true,
      },
      fn: async (ctx) => {
        const resourceItem = await updateResource(ctx.resourceItem, ctx.request.data);
        ctx.response = {
          data: resourceItem,
        };
      },
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
        await waitFor(50);
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
