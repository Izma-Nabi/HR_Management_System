const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiResponse");
const { verifyAccessToken } = require("../utils/jwt");
const authRepository = require("../modules/auth/auth.repository");

// This middleware protects routes that require a logged-in user.
// It expects: Authorization: Bearer <jwt_token>
const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization header is missing or invalid");
  }

  const token = authHeader.split(" ")[1];
  const decodedToken = verifyAccessToken(token);

  // The JWT contains the user id in the standard "sub" claim.
  // We still load the user from the database so disabled accounts cannot
  // keep using old tokens.
  const user = await authRepository.findUserById(decodedToken.sub);

  if (!user) {
    throw new ApiError(401, "User account no longer exists");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "User account is not active");
  }

  // Attach the safe user object to req so later middleware/controllers can use it.
  req.user = user;
  req.auth = {
    token,
    tokenPayload: decodedToken
  };

  return next();
});

module.exports = authMiddleware;
