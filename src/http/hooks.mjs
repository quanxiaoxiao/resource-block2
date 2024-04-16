import createError from 'http-errors';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';
import { selectRouteMatchList } from '../store/selector.mjs';

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
    ctx.request.params = ctx.routeMatched.urlMatch(ctx.request.pathname).params;
    if (ctx.routeMatched.query) {
      ctx.request.query = ctx.routeMatched.query(ctx.request.query);
    }
    if (ctx.routeMatched.match) {
      if (!ctx.routeMatched.match(ctx.request)) {
        throw createError(400);
      }
    }
    if (ctx.routeMatched.onPre) {
      await ctx.routeMatched.onPre(ctx);
    }
    if (['PUT', 'POST'].includes(ctx.request.method)) {
      ctx.onRequest = async (_ctx) => {
        const data = decodeContentToJSON(ctx.request.body, _ctx.request.headers);
        if (requestHandler.validate && !requestHandler.validate(data)) {
          throw createError(400, JSON.stringify(requestHandler.validate.errors));
        }
        _ctx.request.data = data;
        await requestHandler.fn(_ctx);
      };
    } else {
      ctx.onRequest = requestHandler.fn;
    }
    if (ctx.routeMatched.select) {
      ctx.onResponse = (_ctx) => {
        _ctx.response.data = ctx.routeMatched.select(_ctx.response.data);
      };
    }
    if (ctx.routeMatched.onPost) {
      const _onResponse = ctx.onResponse;
      ctx.onResponse = async (_ctx) => {
        if (_onResponse) {
          await _onResponse(_ctx);
        }
        await ctx.routeMatched.onPost(_ctx);
      };
    }
  },
  onHttpError: (ctx) => {
    console.warn(`${ctx.request.method} ${ctx.request.path} ${ctx.error.message}`);
    if (ctx.response.statusCode >= 500 && ctx.response.statusCode <= 599) {
      console.error(ctx.error);
    }
  },
};
