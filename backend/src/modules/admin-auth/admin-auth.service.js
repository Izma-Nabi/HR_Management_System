const { ApiError } = require("../../utils/apiResponse");
const { comparePassword, hashPassword } = require("../../utils/password");
const { signAccessToken } = require("../../utils/jwt");
const adminAuthRepository = require("./admin-auth.repository");

// Admin service: rules for SUPER_ADMIN and ADMIN accounts.

const loginAdmin = async ({ email, password }) => {
  const user = await adminAuthRepository.findAdminByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Your account is not active");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signAccessToken({
    id: user.id,
    role: user.role
  });

  return {
    token,
    user: adminAuthRepository.toSafeUser(user)
  };
};

const createAdmin = async ({ fullName, email, password, role }) => {
  const existingUser = await adminAuthRepository.findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const passwordHash = await hashPassword(password);
  const admin = await adminAuthRepository.createAdmin({
    fullName,
    email,
    passwordHash,
    role: role || "ADMIN"
  });

  return adminAuthRepository.toSafeUser(admin);
};

module.exports = {
  loginAdmin,
  createAdmin
};
