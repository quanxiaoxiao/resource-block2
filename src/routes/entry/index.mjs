import store from '../../store/store.mjs';
import entryType from '../../types/entry.mjs';
import createEntry from './createEntry.mjs';
import findEntry from './findEntry.mjs';
import removeEntry from './removeEntry.mjs';
import updateEntry from './updateEntry.mjs';
import queryEntries from './queryEntries.mjs';
import sortEntries from './sortEntries.mjs';

const { dispatch } = store;

export default {
  '/api/entries/sort': {
    select: {
      type: 'array',
      properties: ['_id', { type: 'string' }],
    },
    onPost: (ctx) => {
      dispatch('entryList', ctx.entryList);
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
        const entryItem = await createEntry(ctx.contentData);
        ctx.entryItem = entryItem;
        ctx.response = {
          data: entryItem,
        };
      },
    },
    onPost: (ctx) => {
      dispatch('entryList', (pre) => [...pre, ctx.entryItem]);
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
      const entryItem = await findEntry(decodeURIComponent(ctx.matches[2]));
      if (!entryItem) {
        ctx.throw(404);
      }
      ctx.entryItem = entryItem;
    },
    get: {
      fn: (ctx) => {
        ctx.response = {
          data: ctx.entryItem,
        };
      },
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
        const entryItem = await updateEntry(ctx.entryItem, ctx.response.data);
        ctx.response = {
          data: entryItem,
        };
      },
    },
    delete: {
      fn: async (ctx) => {
        await removeEntry(ctx.entryItem);
        ctx.response = {
          data: ctx.entryItem,
        };
      },
    },
    onPost: (ctx) => {
      if (ctx.entryList) {
        dispatch('entryList', ctx.entryList);
      }
    },
  },
};
