const { ApiError } = require("../../utils/apiResponse");
const { comparePassword, hashPassword } = require("../../utils/password");
const { signAccessToken } = require("../../utils/jwt");
const authRepository = require("./auth.repository");

const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Your account is not active");
  }

  if (!user.role) {
    throw new ApiError(403, "Your account role is not supported");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signAccessToken({
    id: user.id,
    role: user.role
  });

  const { passwordHash, ...safeUser } = user;

  return {
    token,
    user: safeUser
  };
};

const getCurrentUser = async (userId) => {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  if (!user.role) {
    throw new ApiError(403, "Your account role is not supported");
  }

  return {
    user
  };
};

const signup = async ({ fullName, email, password, role }) => {
  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const passwordHash = await hashPassword(password);
  const admin = await authRepository.createAdmin({
    fullName,
    email,
    passwordHash,
    role: role || "ADMIN"
  });

  return {
    user: authRepository.toSafeUser(admin)
  };
};

const logout = async () => {
  return {};
};

module.exports = {
  login,
  getCurrentUser,
  signup,
  logout
};
