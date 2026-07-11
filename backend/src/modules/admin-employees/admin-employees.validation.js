const Joi = require("joi");

const optionalText = (max) => Joi.string().trim().max(max).empty("").allow(null).default(null);

const createEmployeeSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required"
  }),

  password: Joi.string().min(8).max(128).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters"
  }),

  employeeCode: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Employee code is required",
    "string.min": "Employee code must be at least 2 characters"
  }),

  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Employee name is required",
    "string.min": "Employee name must be at least 2 characters"
  }),

  phone: optionalText(30),
  department: optionalText(100),
  designation: optionalText(100),
  fingerprintId: optionalText(100),

  employmentStatus: Joi.string()
    .trim()
    .uppercase()
    .valid("ACTIVE", "INACTIVE", "RESIGNED", "TERMINATED")
    .default("ACTIVE")
});

module.exports = {
  createEmployeeSchema
};
