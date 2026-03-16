// middleware/errorMiddleware.js
// global error-handling middleware that:

// Catches any errors thrown in your routes or controllers

// Logs them to your server console (for developers)

// Sends a consistent JSON response to the frontend
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  logger.error(`${req.method} ${req.originalUrl} → ERROR`, {
    message: err.message,
    stack: err.stack,
    requestId: req.requestId
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorHandler;