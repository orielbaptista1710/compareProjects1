// middleware/errorMiddleware.js
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
