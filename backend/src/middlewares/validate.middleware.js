const { ApiError } = require("../utils/apiResponse");

// This middleware validates request data before it reaches the controller.
// schema is a Joi schema, and source tells us which part of req to validate.
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const formattedErrors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message
      }));

      return next(new ApiError(400, "Validation failed", formattedErrors));
    }

    // Replace the original data with Joi's cleaned value.
    // Example: email becomes lowercase and extra fields are removed.
    req[source] = value;

    return next();
  };
};

module.exports = validate;

