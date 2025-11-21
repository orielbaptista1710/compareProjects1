// middleware/errorMiddleware.js
// global error-handling middleware that:

// Catches any errors thrown in your routes or controllers

// Logs them to your server console (for developers)

// Sends a consistent JSON response to the frontend
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // server log

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "development" ? null : err.stack
  });
};

module.exports = errorHandler;
