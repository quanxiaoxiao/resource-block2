import assert from 'node:assert';
import Ajv from 'ajv';
import _ from 'lodash';
import { select } from '@quanxiaoxiao/datav';
import { generateRouteList } from '@quanxiaoxiao/http-router';
import store from '../store/store.mjs';
import routes from '../routes/index.mjs';

const { dispatch } = store;

export default () => {
  const routeList = generateRouteList(routes);
  dispatch('routeMatchList', routeList.map((d) => {
    const routeItem = {
      match: d.match,
      pathname: d.pathname,
      urlMatch: d.urlMatch,
    };
    if (d.select) {
      routeItem.select = select(d.select);
      routeItem.select.toJSON = () => d.select;
    }
    if (!_.isEmpty(d.query)) {
      routeItem.query = select({
        type: 'object',
        properties: d.query,
      });
      routeItem.query.toJSON = () => d.query;
    }
    if (d.onPre) {
      routeItem.onPre = d.onPre;
    }
    if (d.onPost) {
      routeItem.onPost = d.onPost;
    }
    const httpMethodList = ['get', 'post', 'put', 'delete'];
    for (let i = 0; i < httpMethodList.length; i++) {
      const handler = d[httpMethodList[i]];
      const httpMethod = httpMethodList[i].toUpperCase();
      if (handler) {
        if (typeof handler === 'function') {
          routeItem[httpMethod] = {
            fn: handler,
          };
        } else {
          assert(_.isPlainObject(handler));
          assert(typeof handler.fn === 'function');
          routeItem[httpMethod] = {
            fn: handler.fn,
          };
          if (handler.validate) {
            const ajv = new Ajv();
            routeItem[httpMethod].validate = ajv.compile(handler.validate);
            routeItem[httpMethod].validate.toJSON = () => handler.validate;
          }
          if (handler.onRequestEnd) {
            routeItem[httpMethod].onRequestEnd = handler.onRequestEnd;
          }
        }
      }
    }
    return routeItem;
  }));
};
