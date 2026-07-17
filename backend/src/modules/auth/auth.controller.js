const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const authService = require("./auth.service");

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return sendSuccess(res, 200, "Login successful", result);
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.user.id);

  return sendSuccess(res, 200, "Current user fetched successfully", result);
});

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);

  return sendSuccess(res, 201, "Administrator created successfully", result);
});

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout();

  return sendSuccess(res, 200, "Logout successful", result);
});

module.exports = {
  login,
  me,
  signup,
  logout
};
