import net from 'node:net';
import process from 'node:process';
import fs from 'node:fs';
import shelljs from 'shelljs';
import handleSocket from '@quanxiaoxiao/httttp';
import store from './store/store.mjs';
import './models/index.mjs';
import logger from './logger.mjs';
import generateBlockDirs from './configs/generateBlockDirs.mjs';
import checkoutResourceEntries from './configs/checkoutResourceEntries.mjs';
import connectMongo from './connectMongo.mjs';
import generateRouteMatches from './generateRouteMatches.mjs';
import createHttpRequestHooks from './createHttpRequestHooks.mjs';
import routes from './routes/index.mjs';

process.nextTick(async () => {
  const { getState, dispatch } = store;
  await connectMongo();
  await checkoutResourceEntries();

  generateBlockDirs();

  dispatch('routeMatchList', generateRouteMatches(routes));

  {
    const httpRequestHooks = createHttpRequestHooks({
      getRouteMatches: () => getState().routeMatchList,
      logger,
      onSocketClose: (ctx) => {
        const { resourcePathname } = ctx;
        if (resourcePathname) {
          setTimeout(() => {
            if (fs.existsSync(ctx.resourcePathname)) {
              fs.unlinkSync(ctx.resourcePathname);
            }
          }, 50);
        }
      },
    });

    const server = net.createServer((socket) => handleSocket({
      ...httpRequestHooks,
      socket,
    }));
    const { port } = getState().server;
    server.listen(port, () => {
      console.log(`server listen at \`${port}\``);
    });
  }

  process.on('exit', () => {
    if (shelljs.test('-f', getState().configPathnames.state)) {
      shelljs.rm(getState().configPathnames.state);
    }
  });
  process.on('SIGINT', () => {
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('boooooooom');
  console.error(error);
  logger.error(`boooooooom ${error.message}`);
  process.exit(1);
});
