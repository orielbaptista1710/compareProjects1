//utils/logger.js
import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

const devFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    const metaKeys = Object.keys(meta);
    const metaString = metaKeys.length ? ` | ${JSON.stringify(meta)}` : "";

    return `[${timestamp}] ${level.toUpperCase()} → ${message}${metaString}`;
  }
);

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",

  format: winston.format.combine(
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    isProduction ? winston.format.json() : devFormat
  ),

  defaultMeta: { service: "real-compare-api" },

  transports: [
    new winston.transports.Console()
  ]
});

export default logger;