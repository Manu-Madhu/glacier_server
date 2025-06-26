import winston from 'winston';
import path from 'path';

const transports = [new winston.transports.Console()];

if (process.env.NODE_ENV === 'production') {
  const DailyRotateFile = require('winston-daily-rotate-file'); // ⛔ DON'T IMPORT AT TOP

  const logDir = path.join(process.cwd(), 'logs');

  transports.push(
    new DailyRotateFile({
      filename: `${logDir}/%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports,
});

export default logger;
