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
import checkoutResourceEntries from './configs/checkoutResourceEntries.mjs';
import connectMongo from './connectMongo.mjs';
import routes from './routes/index.mjs';

process.nextTick(async () => {
  const { getState, dispatch } = store;
  await connectMongo();
  await checkoutResourceEntries();

  generateBlockDirs();

  dispatch('routeMatchList', generateRouteMatchList(routes));

  const server = net.createServer((socket) => handleSocketRequest({
    socket,
    ...createHttpRequestHandler(getState().routeMatchList, logger),
  }));
  const { port } = getState().server;
  server.listen(port, () => {
    console.log(`server listen at \`${port}\``);
  });
});

process.on('uncaughtException', (error) => {
  console.error('boooooooom');
  console.error(error);
  logger.error(`boooooooom ${error.message}`);
  process.exit(1);
});
