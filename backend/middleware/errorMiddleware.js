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

  // Mongoose rejected the data (required field, enum, format, bad id): that's
  // the caller's mistake, so a 400 naming the fields — not a 500 that
  // production masks as "Server error". Field names only, never the values.
  if (err.name === "ValidationError" || err.name === "CastError") {
    const fields = err.name === "ValidationError" ? Object.keys(err.errors ?? {}) : [err.path];
    return res.status(400).json({
      success: false,
      message: `Invalid fields: ${fields.filter(Boolean).join(", ") || "body"}`,
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Unexpected 5xx messages can expose DB/internal details — hide them in
  // production (full error is logged above). Deliberate 4xx messages pass through.
  const hideMessage = statusCode >= 500 && process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message: hideMessage ? "Server error" : err.message || "Server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorHandler;