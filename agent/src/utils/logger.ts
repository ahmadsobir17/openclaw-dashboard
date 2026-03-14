import pino from 'pino';
import pinoPretty from 'pino-pretty';

const isDev = process.env.NODE_ENV !== 'production';

let logger: pino.Logger;

if (isDev) {
  const pretty = pinoPretty({
    translateTime: 'HH:MM:ss Z',
    ignore: 'pid,hostname',
    levelFirst: true,
  });
  logger = pino(
    {
      level: process.env.LOG_LEVEL || 'info',
    },
    pretty
  );
} else {
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
  });
}

export default logger;
