const Joi = require("joi");

// Login only needs email and password.
const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required"
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required"
  })
});

module.exports = {
  loginSchema
};
