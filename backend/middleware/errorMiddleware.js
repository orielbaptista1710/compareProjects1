// middleware/errorMiddleware.js
// global error-handling middleware that:
// Catches any errors thrown in your routes or controllers
// Logs them to your server console (for developers)
// Sends a consistent JSON response to the frontend   backend/
import { Prisma } from "@prisma/client";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  void next(); // Ensure next is called to avoid unhandled promise rejections

  logger.error(`${req.method} ${req.originalUrl} → ERROR`, {
    message: err.message,
    stack: err.stack,
    requestId: req.requestId
  });

  // Prisma-specific: unique constraint violation (e.g. duplicate CrmUser email)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorHandler;