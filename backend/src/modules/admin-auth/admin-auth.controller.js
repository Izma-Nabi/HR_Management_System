const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const adminAuthService = require("./admin-auth.service");

// Admin controllers receive admin HTTP requests and delegate business rules.

const login = asyncHandler(async (req, res) => {
  const result = await adminAuthService.loginAdmin(req.body);

  return sendSuccess(res, 200, "Login successful", result);
});

const signup = asyncHandler(async (req, res) => {
  const result = await adminAuthService.createAdmin(req.body);

  return sendSuccess(res, 201, "Administrator created successfully", result);
});

module.exports = {
  login,
  signup
};
