import net from 'node:net';
import process from 'node:process';
import tls from 'node:tls';

import {
  createHttpRequestHandler,
  generateRouteMatchList,
  handleSocketRequest,
} from '@quanxiaoxiao/httttp';

import configEntries from '#controllers/entry/configEntries.mjs';
import logger from '#logger.mjs';
import { selectRouteMatchList } from '#selector.mjs';
import { dispatch, getState, getValue } from '#store.mjs';

import generateBlockDirs from './configs/generateBlockDirs.mjs';
import connectMongo from './connectMongo.mjs';
import routes from './routes/index.mjs';

const initializeServer = async () => {
  try {
    logger.info('Starting server initialization...');
    await connectMongo();
    await configEntries();
    generateBlockDirs();
    dispatch('routeMatchList', generateRouteMatchList(routes));
    logger.info('Route match list generated');
  } catch (error) {
    logger.error('Server initialization failed:', error);
    throw error;
  }
};

const handleConnection = (socket) => {
  return handleSocketRequest({
    socket,
    ...createHttpRequestHandler({
      list: selectRouteMatchList(),
      logger,
    }),
  });
};

const createTLSServer = () => {
  logger.warn('Creating Tls Server');
  const state = getState();
  const server = tls.createServer(
    {
      cert: state.tls.cert,
      key: state.tls.key,
      minVersion: 'TLSv1.2',
    },
    handleConnection,
  );
  return server;
};

const createHttpServer = () => {
  logger.warn('Creating Http Server');
  const server = net.createServer(handleConnection);
  return server;
};

const startHttpServer = () => {
  const state = getState();
  const port = getValue('server.port');
  const server = state.tls && state.tls.cert ? createTLSServer() : createHttpServer();
  return new Promise((resolve, reject) => {
    server.on('error', (error) => {
      logger.error('Server error:', error);
      reject(error);
    });

    server.listen(port, () => {
      logger.warn(`Server listening on port ${port}`);
      console.log(`server listen at \`${port}\``);
      resolve(server);
    });
  });

};

const gracefulShutdown = async (signal = 'SIGINT') => {
  try {
    logger.warn(`Received ${signal}, shutting down gracefully...`);
    console.log('server will stop...');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  } finally {
    process.exit(0);
  }
};

const setupProcessHandlers = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    console.log('----- uncaught exception start -----');
    console.error(error);
    console.log('----- uncaught exception end -----');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
    console.error('Unhandled Promise Rejection:', reason);
  });

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

const main = async () => {
  try {
    setupProcessHandlers();

    await initializeServer();
    await startHttpServer();
    logger.info('Server started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }

};

process.nextTick(main);
