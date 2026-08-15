const Joi = require("joi");

const attendanceDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .required()
  .messages({
    "string.pattern.base": "date must use YYYY-MM-DD format"
  });

const dayParams = Joi.object({
  date: attendanceDate
});

const weekQuery = Joi.object({
  startDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({
      "string.pattern.base": "startDate must use YYYY-MM-DD format"
    })
});

const createComplaint = Joi.object({
  attendanceDate,
  requestAction: Joi.string().valid("INSERT", "EDIT").required(),
  eventType: Joi.string().valid("CHECK_IN", "CHECK_OUT").required(),
  correctedTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "correctedTime must use HH:mm format"
    }),
  reason: Joi.string().trim().min(10).max(2000).required()
});

const reviewComplaint = Joi.object({
  status: Joi.string().valid("APPROVED", "REJECTED").required(),
  reviewNote: Joi.string().trim().allow("").max(2000),
  attendanceDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({
      "string.pattern.base": "attendanceDate must use YYYY-MM-DD format"
    }),
  correctedTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .messages({
      "string.pattern.base": "correctedTime must use HH:mm format"
    })
});

const complaintParams = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createComplaint,
  complaintParams,
  dayParams,
  reviewComplaint,
  weekQuery
};
