const Joi = require("joi");

const createDesignationSchema = Joi.object({
  departmentId: Joi.number().integer().positive().required().messages({
    "number.base": "Department is required",
    "any.required": "Department is required"
  }),
  designationName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Designation name is required",
    "string.min": "Designation name must be at least 2 characters"
  })
});

module.exports = {
  createDesignationSchema
};
