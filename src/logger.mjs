import process from 'node:process';
import { isMainThread } from 'node:worker_threads';

import createLogger from '@quanxiaoxiao/logger';
import { getPathname } from '@quanxiaoxiao/node-utils';
import dayjs from 'dayjs';

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
};

const createDefaultLogger = () => ({
  error: (message, ...other) => console.error(`[ERROR] ${message}`, ...other),
  warn: (message, ...other) => console.warn(`[WARN] ${message}`, ...other),
  info: (message, ...other) => console.info(`[INFO] ${message}`, ...other),
  debug: (message, ...other) => console.debug(`[DEBUG] ${message}`, ...other),
});

const formatLogMessage = ({ level, message }) => {
  const timestamp = dayjs().format('YYYYMMDD_HHmmss.SSS');
  return `[${level.toUpperCase()} ${timestamp}] ${message}`;
};

const createLoggerOptions = () => {
  const fd1Path = process.env.LOGGER_FD1 ? getPathname(process.env.LOGGER_FD1) : null;
  const fd2Path = process.env.LOGGER_FD2 ? getPathname(process.env.LOGGER_FD2) : null;
  const level = process.env.LOGGER_LEVEL || LOG_LEVELS.INFO;

  return {
    fd1: fd1Path,
    fd2: fd2Path,
    level,
    format: formatLogMessage,
  };
};

const logConfiguration = (options) => {
  if (!isMainThread) {
    return;
  }

  const messages = [
    '-------------------------',
    `Logger combine path: ${options.fd1 || 'Not configured'}`,
    `Logger error path: ${options.fd2 || 'Not configured'}`,
    `Logger level: ${options.level}`,
    `NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`,
    '-------------------------',
    '',
  ];

  messages.forEach(msg => console.warn(msg));
};

const isProductionEnvironment = () => {
  const env = process.env.NODE_ENV;
  return env === ENVIRONMENTS.DEVELOPMENT || env === ENVIRONMENTS.PRODUCTION;
};

const initializeLogger = () => {
  if (!isProductionEnvironment()) {
    return createDefaultLogger();
  }

  try {
    const options = createLoggerOptions();
    logConfiguration(options);
    return createLogger(options);
  } catch (error) {
    console.error('Failed to initialize logger:', error.message);
    return createDefaultLogger();
  }
};

const logger = initializeLogger();

export default logger;
