import createStore from '@quanxiaoxiao/store';
import initialState from './initialState.mjs';

const store = createStore({
  initialState,
  schemas: {
    'server.port': {
      type: 'integer',
      maximum: 65535,
      minimum: 1,
    },
    'cipher.select': {
      type: 'string',
      minLength: 1,
    },
    'block.dir': {
      type: 'string',
      minLength: 1,
    },
    'block.tempDir': {
      type: 'string',
      minLength: 1,
    },
    'cipher.algorithm': {
      enum: ['aes-256-ctr'],
    },
    'mongo.port': {
      type: 'integer',
      maximum: 65535,
      minimum: 1,
    },
  },
  middlewares: [],
});

export default store;
