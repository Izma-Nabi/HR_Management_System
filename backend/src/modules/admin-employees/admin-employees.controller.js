const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const adminEmployeesService = require("./admin-employees.service");

const createEmployee = asyncHandler(async (req, res) => {
  const result = await adminEmployeesService.createEmployee(req.body);

  return sendSuccess(res, 201, "Employee created successfully", result);
});

module.exports = {
  createEmployee
};
