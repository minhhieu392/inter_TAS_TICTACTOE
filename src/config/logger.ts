import winston from 'winston';
import { ENV } from '../utils/utils';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  const env = ENV || 'development'
  const isDevelopment = env === 'development'
  // return isDevelopment ? 'debug' : 'warn'
  return 'debug'
}

const colors = {
  error: 'red',
  warn: 'magenta',
  info: 'blue',
  http: 'magenta',
  debug: 'yellow',
}

winston.addColors(colors)

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.json()
  })
]

const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
})

export default Logger