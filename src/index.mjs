import './store/store.mjs';

import net from 'node:net';
import process from 'node:process';

import {
  createHttpRequestHandler,
  generateRouteMatchList,
  handleSocketRequest,
} from '@quanxiaoxiao/httttp';

import generateBlockDirs from './configs/generateBlockDirs.mjs';
import connectMongo from './connectMongo.mjs';
import configEntries from './controllers/entry/configEntries.mjs';
import logger from './logger.mjs';
import routes from './routes/index.mjs';
import { selectRouteMatchList } from './store/selector.mjs';
import { dispatch,getState } from './store/store.mjs'; // eslint-disable-line

// dateTime invalid

process.nextTick(async () => {
  await connectMongo();
  await configEntries();

  generateBlockDirs();

  dispatch('routeMatchList', generateRouteMatchList(routes));

  const server = net.createServer((socket) => handleSocketRequest({
    socket,
    ...createHttpRequestHandler({
      list: selectRouteMatchList(),
      logger,
    }),
  }));

  const { port } = getState().server;

  server.listen(port, () => {
    console.log(`server listen at \`${port}\``);
  });
});

process.on('uncaughtException', (error) => {
  console.log('----- boooooooom start -----');
  console.error(error);
  console.log('----- boooooooom end -----');
});
