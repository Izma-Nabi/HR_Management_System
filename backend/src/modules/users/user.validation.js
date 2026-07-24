const Joi=require("joi");

const createUserSchema=Joi.object({

 firstName:Joi.string().trim().max(100).required(),

 lastName:Joi.string().trim().max(100).required(),

 email:Joi.string().email().lowercase().required(),

 password:Joi.string().min(8).required(),

 phone:Joi.string().allow("",null),

 address:Joi.string().allow("",null),

 roleId:Joi.number().integer().positive().required(),

 departmentId:Joi.number().integer().positive().allow(null),

 designationId: Joi.number().integer().positive().empty("").allow(null),

 photo:Joi.string().allow("",null)
});

module.exports={
 createUserSchema
};