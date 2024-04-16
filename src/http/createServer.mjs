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

  server.listen(getState().server.port);
};
