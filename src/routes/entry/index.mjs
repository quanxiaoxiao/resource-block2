import createError from 'http-errors';

import findEntry from '../../controllers/entry/findEntry.mjs';
import getEntryList from '../../controllers/entry/getEntryList.mjs';
import removeEntry from '../../controllers/entry/removeEntry.mjs';
import entryType from '../../types/entry.mjs';
import createEntry from './createEntry.mjs';
// import sortEntries from './sortEntries.mjs';
import statisticsEntry from './statisticsEntry.mjs';
import updateEntry from './updateEntry.mjs';

export default {
  '/api/entries/sort': {
    select: {
      type: 'array',
      properties: ['_id', { type: 'string' }],
    },
    onPost: () => {},
    put: {
      validate: {
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
      fn: async () => {
        /*
        const entryList = await sortEntries(ctx.contentData);
        ctx.response = {
          data: entryList,
        };
        */
        throw createError(403);
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
            not: {
              pattern: '^\\s+$',
            },
          },
          alias: {
            type: 'string',
            nullable: true,
          },
          description: {
            type: 'string',
            nullable: true,
          },
          readOnly: {
            type: 'boolean',
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
  },
  '/api/entries': {
    select: {
      type: 'array',
      properties: entryType,
    },
    get: {
      fn: (ctx) => {
        ctx.response = {
          data: getEntryList(),
        };
      },
    },
  },
  '/api/entry/:entry/statistics': {
    select: {
      type: 'object',
      properties: {
        size: {
          type: 'number',
        },
        count: {
          type: 'integer',
        },
        dateTimeUpdate: {
          type: 'number',
        },
      },
    },
    get: async (ctx) => {
      const dataStatistics = await statisticsEntry(ctx.request.params.entry);
      ctx.response = {
        data: dataStatistics,
      };
    },
  },
  '/api/entry/:entry': {
    select: {
      type: 'object',
      properties: entryType,
    },
    get: (ctx) => {
      const entryItem = findEntry(decodeURIComponent(ctx.request.params.entry));
      if (!entryItem) {
        throw createError(404);
      }
      ctx.response = {
        data: entryItem,
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
          alias: {
            type: 'string',
            nullable: true,
          },
          readOnly: {
            type: 'boolean',
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
        const entryItem = await updateEntry(ctx.request.params.entry, ctx.request.data);
        ctx.response = {
          data: entryItem,
        };
      },
    },
    delete: async (ctx) => {
      const entryItem = await removeEntry(ctx.request.params.entry);
      if (!entryItem) {
        throw createError(404);
      }
      ctx.response = {
        data: entryItem,
      };
    },
  },
};
