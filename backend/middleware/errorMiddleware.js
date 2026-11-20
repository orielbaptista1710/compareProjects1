// middleware/errorMiddleware.js
// global error-handling middleware that:
// Catches any errors thrown in your routes or controllers
// Logs them to your server console (for developers)
// Sends a consistent JSON response to the frontend   backend/
import { Prisma } from "@prisma/client";
import logger from "../utils/logger.js";
import { safeErrorMeta } from "../utils/safeError.js";

const errorHandler = (err, req, res, next) => {
  void next(); // Ensure next is called to avoid unhandled promise rejections

  // Path only: the query string can hold a buyer's name or number (CRM search `q`).
  logger.error(`${req.method} ${req.originalUrl.split("?")[0]} → ERROR`, {
    ...safeErrorMeta(err),
    requestId: req.requestId
  });

  // Request body that isn't valid JSON (body-parser): the caller's mistake.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Request body is not valid JSON" });
  }

  // Prisma-specific: unique constraint violation (e.g. duplicate CrmUser email)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({
      success: false,
      code: "CONFLICT",
      message: "A record with this value already exists",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }

  // Mongoose rejected the data (required field, enum, format, bad id): that's
  // the caller's mistake, so a 400 naming the fields — not a 500 that
  // production masks as "Server error". Field names only, never the values.
  if (err.name === "ValidationError" || err.name === "CastError") {
    const fields = (err.name === "ValidationError" ? Object.keys(err.errors ?? {}) : [err.path]).filter(Boolean);
    // { field: reason } so a form can mark the field; the reason comes from
    // the kind of failure, never from the rejected value.
    const errors = Object.fromEntries(
      fields.map((f) => [f, err.errors?.[f]?.kind === "required" ? "This field is required" : "Invalid value"])
    );
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: `Invalid fields: ${fields.join(", ") || "body"}`,
      errors,
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Unexpected 5xx messages can expose DB/internal details (a Prisma error can
  // quote the row's values), so they are never sent, in any environment. The
  // full error is logged above. Deliberate 4xx messages pass through.
  const hideMessage = statusCode >= 500;

  res.status(statusCode).json({
    success: false,
    message: hideMessage ? "Server error" : err.message || "Server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorHandler;