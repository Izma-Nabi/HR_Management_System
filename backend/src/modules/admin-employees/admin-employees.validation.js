const Joi = require("joi");

const optionalText = (max) => Joi.string().trim().max(max).empty("").allow(null).default(null);
const optionalId = Joi.number().integer().positive().empty("").allow(null).default(null);

const createEmployeeSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required"
  }),

  password: Joi.string().min(8).max(128).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters"
  }),

  firstName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters"
  }),

  lastName: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Last name is required"
  }),

  phone: optionalText(30),
  address: optionalText(255),
  photo: optionalText(255),
  departmentId: Joi.number().integer().positive().required().messages({
    "number.base": "Department is required",
    "any.required": "Department is required"
  }),
  designation: optionalId,
  designationId: optionalId
});

module.exports = {
  createEmployeeSchema
};
