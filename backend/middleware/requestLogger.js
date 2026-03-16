import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";

const SLOW_REQUEST_THRESHOLD = 2000; // 2 seconds

const requestLogger = (req, res, next) => {

  // logger.info("Resquest logger trigger Hitting Middleware")

  const requestId = uuidv4();
  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId); // CAN SEE IN DEVTOOLS

  const start = Date.now();

  res.on("finish", () => {

    const duration = Date.now() - start;

    const logMessage =
      `${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`;

    const metadata = {
      requestId,
      userId: req.user?._id || null,
      ip: req.ip
    };

    

    // ERROR requests
    if (res.statusCode >= 500) {
      logger.error(logMessage, metadata);
      return;
    }

    // SLOW requests
    if (duration > SLOW_REQUEST_THRESHOLD) {
      logger.warn(`Slow request detected → ${logMessage}`, metadata);
      return;
    }

    // Normal request
    logger.info(logMessage, metadata);
  });

  next();
};

export default requestLogger;