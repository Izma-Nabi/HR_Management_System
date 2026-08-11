const Joi = require("joi");

const deviceEvent = Joi.object({
  biometricId: Joi.alternatives()
    .try(Joi.string().trim().min(1), Joi.number())
    .required()
    .messages({
      "any.required": "biometricId is required"
    }),

  event: Joi.string().trim().min(1).required().messages({
    "any.required": "event (e.g. 'C/In', 'C/Out') is required"
  }),

  eventTime: Joi.string().trim().min(1).required().messages({
    "any.required": "eventTime is required"
  }),

  locationId: Joi.number().integer().positive().optional(),

  deviceRecordId: Joi.alternatives()
    .try(Joi.string().trim(), Joi.number())
    .optional()
});

module.exports = {
  deviceEvent
};
