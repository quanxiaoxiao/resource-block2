import createError from 'http-errors';
import { decodeContentToJSON } from '@quanxiaoxiao/http-utils';

export default ({
  getRouteMatches,
  logger,
  onRequest,
  onResponse,
  onSocketClose,
}) => ({
  onHttpRequestStartLine: (ctx) => {
    const routeMatchList = getRouteMatches();
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
    if (ctx.routeMatched.match && !ctx.routeMatched.match(ctx.request)) {
      throw createError(400);
    }

    if (onRequest) {
      await onRequest(ctx);
    }

    if (ctx.socket.writable && ctx.routeMatched.onPre) {
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
  onHttpRequestEnd: async (ctx) => {
    if (ctx.requestHandler.onRequestEnd) {
      await ctx.requestHandler.onRequestEnd(ctx);
    }
  },
  onHttpResponseEnd: (ctx) => {
    if (ctx.routeMatched.onPost) {
      ctx.routeMatched.onPost(ctx);
    }
    if (onResponse) {
      onResponse(ctx);
    }
  },
  onHttpError: (ctx) => {
    logger.warn(`$$${ctx.request.method} ${ctx.request.path} ${ctx.response.statusCode} ${ctx.error.message}`);
    if (ctx.response.statusCode >= 500 && ctx.response.statusCode <= 599) {
      console.error(ctx.error);
    }
  },
  onClose: (ctx) => {
    if (onSocketClose) {
      onSocketClose(ctx);
    }
  },
});
