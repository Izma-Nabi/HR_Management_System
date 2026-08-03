const { ApiError } = require("../../utils/apiResponse");
const { comparePassword, hashPassword } = require("../../utils/password");
const { signAccessToken } = require("../../utils/jwt");
const authRepository = require("./auth.repository");
const crypto = require("crypto");
const transporter = require("./mail.service");
const resetPasswordTemplate = require("./reset-password-template");


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

const forgotPassword = async (email) => {
  const user = await authRepository.findUserByEmail(email);

  // Don't reveal whether the email exists
  if (!user) {
    return {};
  }

  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await authRepository.deletePasswordResetToken(user.id);

  await authRepository.createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt
  });

  const resetLink =
    `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Reset Your Password",
    html: resetPasswordTemplate(
      user.firstName,
      resetLink
    )
  });

  return {};
};

const resetPassword = async ({
  token,
  password
}) => {

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const resetToken =
    await authRepository.findPasswordResetToken(tokenHash);

  if (!resetToken) {
    throw new ApiError(
      400,
      "Reset link is invalid or has expired"
    );
  }

  const passwordHash =
    await hashPassword(password);

  await authRepository.updateUserPassword(
    resetToken.userId,
    passwordHash
  );

  await authRepository.removePasswordResetToken(
    resetToken.id
  );

  return {};
};

module.exports = {
  login,
  getCurrentUser,
  signup,
  logout,
  forgotPassword,
  resetPassword
};