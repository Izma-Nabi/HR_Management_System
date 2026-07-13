const Joi = require("joi");

const createDepartmentSchema = Joi.object({
  departmentName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Department name is required",
    "string.min": "Department name must be at least 2 characters"
  }),

  description: Joi.string().trim().max(255).empty("").allow(null).default(null)
});

const updateDepartmentSchema = Joi.object({
  departmentName: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "Department name must be at least 2 characters"
  }),

  description: Joi.string().trim().max(255).empty("").allow(null).optional()
}).min(1).messages({
  "object.min": "At least one field is required"
});

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema
};
