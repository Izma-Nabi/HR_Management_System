const { ApiError } = require("../../utils/apiResponse");
const { comparePassword } = require("../../utils/password");
const { signAccessToken } = require("../../utils/jwt");
const employeeAuthRepository = require("./employee-auth.repository");

// The service layer owns business rules.
// It decides what should happen, while the repository only knows how to query.

const loginEmployee = async ({ email, password }) => {
  const user = await employeeAuthRepository.findUserByEmail(email);

  // Use a generic message so attackers cannot confirm which emails exist.
  if (!user || user.role !== "EMPLOYEE") {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Your account is not active");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const account = await employeeAuthRepository.findEmployeeAccountByUserId(user.id);

  if (!account) {
    throw new ApiError(403, "Employee record is not configured for this user");
  }

  const token = signAccessToken({
    id: account.user.id,
    role: account.user.role
  });

  return {
    user: account.user,
    employee: account.employee,
    token
  };
};

const getCurrentEmployee = async (userId) => {
  const account = await employeeAuthRepository.findEmployeeAccountByUserId(userId);

  if (!account) {
    throw new ApiError(404, "Employee account not found");
  }

  return account;
};

const logoutEmployee = async () => {
  // With stateless JWT auth, logout is handled by the client deleting its token.
  // For immediate server-side token invalidation, add a token blacklist or
  // refresh-token table later. That is intentionally outside this first module.
  return {};
};

module.exports = {
  loginEmployee,
  getCurrentEmployee,
  logoutEmployee
};
