const jwt = require("jsonwebtoken");
const env = require("../../../global/env");
const { ApiError } = require("./apiResponse");

// Create a JWT access token after a successful login.
// The token stores only safe identity data: user id in sub and the user's role.
const signAccessToken = ({ id, role }) => {
  return jwt.sign(
    { role },
    env.jwt.secret,
    {
      subject: String(id),
      expiresIn: env.jwt.expiresIn
    }
  );
};

// Verify a token from the Authorization header.
// If verification fails, we throw a controlled 401 error.
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Authentication token has expired");
    }

    throw new ApiError(401, "Invalid authentication token");
  }
};

module.exports = {
  signAccessToken,
  verifyAccessToken
};
