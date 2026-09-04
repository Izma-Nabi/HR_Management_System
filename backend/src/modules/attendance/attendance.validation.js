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
  dailyAttendanceId: Joi.number().integer().positive().required(),
  rawAttendanceId: Joi.number().integer().positive().required(),
  complaintType: Joi.string()
    .valid("CHECK_IN", "CHECK_OUT", "BOTH", "STATUS", "OTHER")
    .required(),
  reason: Joi.string().trim().min(10).max(2000).required()
});

module.exports = {
  createComplaint,
  dayParams,
  weekQuery
};
