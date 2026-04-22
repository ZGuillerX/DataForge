import winston from "winston";
import { env } from "../../config/env";

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

export function createJobLogger(jobId: string) {
  return {
    info: (msg: string, meta?: object) => logger.info(msg, { jobId, ...meta }),
    warn: (msg: string, meta?: object) => logger.warn(msg, { jobId, ...meta }),
    error: (msg: string, meta?: object) =>
      logger.error(msg, { jobId, ...meta }),
    debug: (msg: string, meta?: object) =>
      logger.debug(msg, { jobId, ...meta }),
  };
}
