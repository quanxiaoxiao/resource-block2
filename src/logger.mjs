import process from 'node:process';
import dayjs from 'dayjs';
import { getPathname } from '@quanxiaoxiao/node-utils';
import createLogger from '@quanxiaoxiao/logger';

const options = {
  fd1: getPathname(process.env.LOGGER_FD1),
  fd2: getPathname(process.env.LOGGER_FD2),
  level: process.env.LOGGER_LEVEL || 'info',
  format: ({ level, message }) => {
    const now = Date.now();
    return `[${level} ${dayjs(now).format('YYYYMMDD_HHmmss.SSS')}] ${message}`;
  },
};

console.warn('-------------------------');
console.warn(`logger combine path \`${options.fd1}\``);
console.warn(`logger error path \`${options.fd2}\``);
console.warn(`logger level \`${options.level}\``);
console.warn(`NODE_ENV \`${process.env.NODE_ENV}\``);
console.warn('-------------------------');
console.log('');

const logger = createLogger(options);

export default logger;
