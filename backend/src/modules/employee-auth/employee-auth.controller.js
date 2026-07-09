const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const employeeAuthService = require("./employee-auth.service");

// Controllers receive HTTP requests and send HTTP responses.
// They stay small because validation, business logic, and SQL live elsewhere.

const login = asyncHandler(async (req, res) => {
  const result = await employeeAuthService.loginEmployee(req.body);

  return sendSuccess(res, 200, "Employee login successful", result);
});

const me = asyncHandler(async (req, res) => {
  const result = await employeeAuthService.getCurrentEmployee(req.user.id);

  return sendSuccess(res, 200, "Employee profile fetched successfully", result);
});

const logout = asyncHandler(async (req, res) => {
  const result = await employeeAuthService.logoutEmployee();

  return sendSuccess(res, 200, "Employee logout successful", result);
});

module.exports = {
  login,
  me,
  logout
};
