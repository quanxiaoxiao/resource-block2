import fs from 'node:fs';
import createError from 'http-errors';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';
import { selectRouteMatchList } from '../store/selector.mjs';
import logger from '../logger.mjs';

export default {
  onHttpRequestStartLine: (ctx) => {
    const routeMatchList = selectRouteMatchList();
    const routeMatched = routeMatchList.find((routeItem) => routeItem.urlMatch(ctx.request.pathname));
    if (!routeMatched) {
      throw createError(404);
    }
    ctx.routeMatched = routeMatched;
  },
  onHttpRequestHeader: async (ctx) => {
    const requestHandler = ctx.routeMatched[ctx.request.method];
    if (!requestHandler) {
      throw createError(405);
    }
    ctx.requestHandler = requestHandler;
    ctx.request.params = ctx.routeMatched.urlMatch(ctx.request.pathname).params;
    if (ctx.routeMatched.query) {
      ctx.request.query = ctx.routeMatched.query(ctx.request.query);
    }
    if (ctx.routeMatched.match
      && !ctx.routeMatched.match(ctx.request)) {
      throw createError(400);
    }

    if (ctx.routeMatched.onPre) {
      await ctx.routeMatched.onPre(ctx);
    }

    if (ctx.socket.writable) {
      if (!requestHandler.validate) {
        await requestHandler.fn(ctx);
      } else {
        ctx.onRequest = async (_ctx) => {
          const data = decodeContentToJSON(ctx.request.body, _ctx.request.headers);
          if (!data) {
            throw createError(400);
          }
          if (!requestHandler.validate(data)) {
            throw createError(400, JSON.stringify(requestHandler.validate.errors));
          }
          _ctx.request.data = data;
          await requestHandler.fn(_ctx);
        };
      }

      if (ctx.routeMatched.select) {
        ctx.onResponse = (_ctx) => {
          if (!_ctx.response) {
            throw createError(503);
          }
          if (!_ctx.response.data) {
            throw createError(404);
          }
          _ctx.response.data = ctx.routeMatched.select(_ctx.response.data);
        };
      }
    }
  },
  onClose: (ctx) => {
    if (ctx.resourcePathname && fs.existsSync(ctx.resourcePathname)) {
      fs.unlinkSync(ctx.resourcePathname);
    }
  },
  onHttpRequestEnd: async (ctx) => {
    if (ctx.requestHandler.onRequestEnd) {
      await ctx.requestHandler.onRequestEnd(ctx);
    }
  },
  onHttpResponseEnd: (ctx) => {
    if (ctx.routeMatched.onPost) {
      ctx.routeMatched.onPost(ctx);
    }
  },
  onHttpError: (ctx) => {
    logger.warn(`${ctx.response.statusCode} ${ctx.request.method} ${ctx.request.path} ${ctx.error.message}`);
    if (ctx.response.statusCode >= 500 && ctx.response.statusCode <= 599) {
      console.error(ctx.error);
    }
  },
};
