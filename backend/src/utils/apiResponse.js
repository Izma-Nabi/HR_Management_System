// ApiError is our custom error class.
// It lets us attach an HTTP status code and optional field-level errors.
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

// Every successful API response should have the same shape.
// This makes frontend handling predictable.
const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Every failed API response should also have the same shape.
// The centralized error middleware uses this helper.
const sendError = (res, statusCode, message, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  ApiError,
  sendSuccess,
  sendError
};

