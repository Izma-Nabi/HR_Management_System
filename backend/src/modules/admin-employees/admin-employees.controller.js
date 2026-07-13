const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const adminEmployeesService = require("./admin-employees.service");

const listEmployees = asyncHandler(async (req, res) => {
  const result = await adminEmployeesService.listEmployees();

  return sendSuccess(res, 200, "Employees fetched successfully", result);
});

const createEmployee = asyncHandler(async (req, res) => {
  const result = await adminEmployeesService.createEmployee(req.body);

  return sendSuccess(res, 201, "Employee created successfully", result);
});

module.exports = {
  listEmployees,
  createEmployee
};
