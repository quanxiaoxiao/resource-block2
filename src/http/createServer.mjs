import net from 'node:net';
import handleSocket from '@quanxiaoxiao/httttp';
import store from '../store/store.mjs';
import hooks from './hooks.mjs';

const { getState } = store;

export default () => {
  const server = net.createServer((socket) => handleSocket({
    ...hooks,
    socket,
  }));

  const { port } = getState().server;

  server.listen(port);
};
