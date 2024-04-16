import process from 'node:process';
import assert from 'node:assert';
import Ajv from 'ajv';
import _ from 'lodash';
import shelljs from 'shelljs';
import { select } from '@quanxiaoxiao/datav';
import { generateRouteList } from '@quanxiaoxiao/http-router';
import store from './store/store.mjs';
import './models/index.mjs';
import createServer from './http/createServer.mjs';
import routes from './routes/index.mjs';

const { getState, dispatch } = store;

createServer();

process.on('exit', () => {
  if (shelljs.test('-f', getState().configPathnames.state)) {
    shelljs.rm(getState().configPathnames.state);
  }
});

process.on('SIGINT', () => {
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('boooooooom');
  console.error(error);
  process.exit(1);
});

process.nextTick(() => {
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
    const methodList = ['get', 'post', 'put', 'delete'];
    for (let i = 0; i < methodList.length; i++) {
      const method = methodList[i];
      const handler = d[method];
      if (handler) {
        if (typeof handler === 'function') {
          routeItem[method.toUpperCase()] = {
            fn: handler,
          };
        } else {
          assert(typeof handler.fn === 'function');
          routeItem[method.toUpperCase()] = {
            fn: handler.fn,
          };
          if (handler.validate) {
            const ajv = new Ajv();
            routeItem[method.toUpperCase()].validate = ajv.compile(handler.validate);
            routeItem[method.toUpperCase()].validate.toJSON = () => handler.validate;
          }
        }
      }
    }
    return routeItem;
  }));
});
