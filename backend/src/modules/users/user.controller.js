const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const userService = require("./user.service");

const createAdmin = asyncHandler(async (req, res) => {

  const result = await userService.createAdmin(req.body);

  return sendSuccess(
    res,
    201,
    "Administrator created successfully",
    result
  );

});

const createEmployee = asyncHandler(async (req, res) => {

  const result = await userService.createEmployee(req.body);

  return sendSuccess(
    res,
    201,
    "Employee created successfully",
    result
  );

});

module.exports = {
  createAdmin,
  createEmployee
};