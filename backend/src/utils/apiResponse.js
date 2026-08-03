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
const serializeBigInt = (value) => {
  return JSON.parse(
    JSON.stringify(value, (_, item) =>
      typeof item === "bigint"
        ? Number(item)
        : item
    )
  );
};


const sendSuccess = (
  res,
  statusCode = 200,
  message = "Request successful",
  data = null
) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data: serializeBigInt(data)
  });
};


const sendError = (
  res,
  statusCode = 500,
  message = "Something went wrong",
  errors = null
) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors
  });
};

module.exports = {
  ApiError,
  sendSuccess,
  sendError,
  serializeBigInt
};