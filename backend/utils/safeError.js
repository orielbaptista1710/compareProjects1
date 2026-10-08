// utils/safeError.js
//
// What to log about an error without leaking customer data. Mongo duplicate-key
// and Mongoose validation errors put the offending values (a customer's email
// or phone) in their message, stack and keyValue, so for those only the field
// names are logged. Anything else is a real bug: keep message and stack.
export function safeErrorMeta(err) {
  if (err?.code === 11000) {
    return { name: err.name, code: 11000, fields: Object.keys(err.keyPattern ?? {}) };
  }
  if (err?.name === 'ValidationError') {
    return { name: err.name, fields: Object.keys(err.errors ?? {}) };
  }
  return { name: err?.name, code: err?.code, message: err?.message, stack: err?.stack };
}
