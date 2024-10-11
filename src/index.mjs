import net from 'node:net';
import process from 'node:process';
import {
  handleSocketRequest,
  createHttpRequestHandler,
  generateRouteMatchList,
} from '@quanxiaoxiao/httttp';
import store from './store/store.mjs';
import './models/index.mjs';
import logger from './logger.mjs';
import generateBlockDirs from './configs/generateBlockDirs.mjs';
import connectMongo from './connectMongo.mjs';
import routes from './routes/index.mjs';
import { selectRouteMatchList } from './store/selector.mjs';
import configEntries from './controllers/entry/configEntries.mjs';

process.nextTick(async () => {
  const { getState, dispatch } = store;
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
