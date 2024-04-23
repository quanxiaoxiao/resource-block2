import * as dotenv from 'dotenv';
import { select } from '@quanxiaoxiao/datav';
import { getPathname } from '@quanxiaoxiao/node-utils';

dotenv.config();

const initialState = {
  dateTimeCreate: Date.now(),
  server: {
    port: select({ type: 'integer' })(process.env.SERVER_PORT),
  },
  entryList: [],
  streamInputList: [],
  streamOutputList: [],
  block: {
    dir: getPathname(process.env.BLOCK_DIR),
    tempDir: getPathname(process.env.BLOCK_TEMP_DIR),
  },
  configPathnames: {
    state: getPathname('./.state.json'),
  },
  cipher: {
    secret: process.env.CIPHER_SECRET,
    algorithm: process.env.CIPHER_ALGORITHM,
  },
  mongo: {
    connect: false,
    dateTimeConnect: null,
    hostname: process.env.MONGO_HOSTNAME || '127.0.0.1',
    port: select({ type: 'integer' })(process.env.MONGO_PORT),
    database: process.env.MONGO_DATABASE,
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
  },
  routeMatchList: [],
};

export default initialState;
