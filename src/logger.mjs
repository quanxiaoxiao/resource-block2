import process from 'node:process';
import { isMainThread } from 'node:worker_threads';

import createLogger from '@quanxiaoxiao/logger';
import { getPathname } from '@quanxiaoxiao/node-utils';
import dayjs from 'dayjs';

let logger = {
  error: (message) => {
    console.log(message);
  },
  warn: (message) => {
    console.log(message);
  },
  logger: (message) => {
    console.log(message);
  },
};
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
  const options = {
    fd1: getPathname(process.env.LOGGER_FD1),
    fd2: getPathname(process.env.LOGGER_FD2),
    level: process.env.LOGGER_LEVEL || 'info',
    format: ({ level, message }) => {
      const now = Date.now();
      return `[${level} ${dayjs(now).format('YYYYMMDD_HHmmss.SSS')}] ${message}`;
    },
  };

  if (isMainThread) {
    console.warn('-------------------------');
    console.warn(`logger combine path \`${options.fd1}\``);
    console.warn(`logger error path \`${options.fd2}\``);
    console.warn(`logger level \`${options.level}\``);
    console.warn(`NODE_ENV \`${process.env.NODE_ENV || null}\``);
    console.warn('-------------------------');
    console.warn('');
  }

  logger = createLogger(options);
}

export default logger;
