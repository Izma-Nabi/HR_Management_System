const env = require("../../../global/env");
const { ApiError, sendError } = require("../utils/apiResponse");

// Handles unknown routes like /wrong/path.
const notFoundHandler = (req, res, next) => {
  return next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

// Converts database errors into friendly API errors.
// Service-level duplicate checks already exist, but this catches race conditions.
const normalizeDatabaseError = (error) => {
  // Prisma uses P2002 for unique constraint violations.
  // Example: duplicate email or duplicate employeeCode.
  if (error && error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "unique field";

    if (target.includes("email")) {
      return new ApiError(409, "Email is already registered");
    }

    if (target.includes("employeeCode")) {
      return new ApiError(409, "Employee code is already registered");
    }

    return new ApiError(409, "Duplicate value already exists");
  }

  return error;
};

// This is the final Express error handler.
// All thrown errors should eventually arrive here.
const errorHandler = (err, req, res, next) => {
  const normalizedError = normalizeDatabaseError(err);

  const statusCode = normalizedError.statusCode || 500;
  const isOperational = normalizedError.isOperational === true;
  const message = isOperational ? normalizedError.message : "Internal server error";
  const errors = normalizedError.errors || [];

  // In development, log unexpected errors so you can debug them.
  // In production, the API response still stays safe and generic.
  if (env.nodeEnv !== "production" && !isOperational) {
    console.error(normalizedError);
  }

  return sendError(res, statusCode, message, errors);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
