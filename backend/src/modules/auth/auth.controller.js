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

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  return sendSuccess(
    res,
    200,
    "If an account exists, a password reset email has been sent.",
    result
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);

  return sendSuccess(
    res,
    200,
    "Password reset successfully.",
    result
  );
});

module.exports = {
  login,
  me,
  signup,
  logout,
  forgotPassword,
  resetPassword
};