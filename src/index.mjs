import process from 'node:process';
import shelljs from 'shelljs';
import store from './store/store.mjs';
import './models/index.mjs';
import createServer from './http/createServer.mjs';
import generateRequestRoutes from './configs/generateRequestRoutes.mjs';
import generateBlockDirs from './configs/generateBlockDirs.mjs';
import checkoutResourceEntries from './configs/checkoutResourceEntries.mjs';

const { getState } = store;

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

process.nextTick(async () => {
  await generateRequestRoutes();
  await generateBlockDirs();
  await checkoutResourceEntries();
});
