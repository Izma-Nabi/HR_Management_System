const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required"
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required"
  })
});

const signupSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Full name is required"
  }),

  email: Joi.string().trim().lowercase().email().max(255).required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required"
  }),

  password: Joi.string().min(8).max(128).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters"
  }),

  role: Joi.string().valid("SUPER ADMIN", "ADMIN").default("ADMIN")
});

module.exports = {
  loginSchema,
  signupSchema
};
