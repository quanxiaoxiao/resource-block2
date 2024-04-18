import curd from '@quanxiaoxiao/curd';
import store from '../../store/store.mjs';
import entryType from '../../types/entry.mjs';
import createEntry from './createEntry.mjs';
import findEntry from './findEntry.mjs';
import removeEntry from './removeEntry.mjs';
import updateEntry from './updateEntry.mjs';
import queryEntries from './queryEntries.mjs';
import sortEntries from './sortEntries.mjs';

const { dispatch, getState } = store;

export default {
  '/api/entries/sort': {
    select: {
      type: 'array',
      properties: ['_id', { type: 'string' }],
    },
    onPost: (ctx) => {
      if (Object.hasOwnProperty.call(ctx, 'entryList')) {
        dispatch('entryList', ctx.entryList);
      }
    },
    put: {
      validate: {
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
      fn: async (ctx) => {
        const entryList = await sortEntries(ctx.contentData);
        ctx.entryList = entryList;
        ctx.response = {
          data: entryList,
        };
      },
    },
  },
  '/api/entry': {
    select: {
      type: 'object',
      properties: entryType,
    },
    post: {
      validate: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
          },
          alias: {
            type: 'string',
            nullable: true,
          },
          description: {
            type: 'string',
            nullable: true,
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      fn: async (ctx) => {
        const entryItem = await createEntry(ctx.request.data);
        ctx.entryItem = entryItem;
        ctx.response = {
          data: entryItem,
        };
      },
    },
    onPost: (ctx) => {
      if (ctx.entryItem) {
        dispatch('entryList', (pre) => [...pre, ctx.entryItem]);
      }
    },
  },
  '/api/entries': {
    select: {
      type: 'array',
      properties: entryType,
    },
    get: {
      fn: async (ctx) => {
        const entryList = await queryEntries({});
        ctx.response = {
          data: entryList,
        };
      },
    },
  },
  '/api/entry/:entry': {
    select: {
      type: 'object',
      properties: entryType,
    },
    onPre: async (ctx) => {
      const entryItem = await findEntry(decodeURIComponent(ctx.request.params.entry));
      if (!entryItem) {
        ctx.throw(404);
      }
      ctx.entryItem = entryItem;
    },
    onPost: (ctx) => {
      if (Object.hasOwnProperty.call(ctx, 'entryList')) {
        dispatch('entryList', ctx.entryList);
      }
    },
    get: (ctx) => {
      ctx.response = {
        data: ctx.entryItem,
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
          alias: {
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
        const entryItem = await updateEntry(ctx.entryItem, ctx.request.data);
        ctx.response = {
          data: entryItem,
        };
        const { entryList } = getState();
        const entry = entryItem._id.toString();
        ctx.entryList = curd.update(
          entryList,
          (d) => d._id.toString() === entry,
          {
            name: entryItem.name,
            alias: entryItem.alias,
            description: entryItem.description,
          },
        );
      },
    },
    delete: async (ctx) => {
      await removeEntry(ctx.entryItem);
      ctx.response = {
        data: ctx.entryItem,
      };
      const { entryList } = getState();
      const entry = ctx.entryItem._id.toString();
      ctx.entryList = curd.remove(entryList, (d) => d._id.toString() === entry);
    },
  },
};
