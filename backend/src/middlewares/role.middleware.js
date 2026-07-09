const { ApiError } = require("../utils/apiResponse");

// Role middleware checks if the logged-in user has one of the allowed roles.
// Example: allowRoles("EMPLOYEE") means only employees can access the route.
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to access this resource"));
    }

    return next();
  };
};

module.exports = allowRoles;

