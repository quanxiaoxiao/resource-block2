import mongoose from 'mongoose';
import { connectDb } from '@quanxiaoxiao/mongo';
import store from '../store/store.mjs';
import blockSchema from './block.mjs';
import resourceSchema from './resource.mjs';
import entrySchema from './entry.mjs';

const { getState, dispatch } = store;

const config = getState().mongo;

await connectDb({
  database: config.database,
  port: config.port,
  hostname: config.hostname,
  username: config.username,
  password: config.password,
  onRequest: (uri) => {
    console.warn(`mongo connect -> ${uri}`);
  },
  onConnect: () => {
    console.warn('mongodb connect success');
    dispatch('mongo', (pre) => ({
      ...pre,
      dateTimeConnect: Date.now(),
      connect: true,
    }));
  },
});

export const Block = mongoose.model('Block', blockSchema);
export const Resource = mongoose.model('Resource', resourceSchema);
export const Entry = mongoose.model('Entry', entrySchema);
