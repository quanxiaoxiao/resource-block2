import { connectDb } from '@quanxiaoxiao/mongo';

export default async () => {
  const { getState, dispatch } = await import('./store/store.mjs');
  const config = getState().mongo;
  await connectDb({
    database: config.database,
    port: config.port,
    hostname: config.hostname,
    username: config.username,
    password: config.password,
    onRequest: (uri) => {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
        console.warn(`mongo connect -> ${uri}`);
      }
    },
    onConnect: () => {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
        console.warn('mongodb connect success');
      }
      dispatch('mongo', (pre) => ({
        ...pre,
        dateTimeConnect: Date.now(),
        connect: true,
      }));
    },
  });
};
