const { ApiError } = require("../utils/apiResponse");

const normalizePermission = (permission) => {
  return String(permission || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
};

const userPermissionSet = (user) => {
  return new Set((user?.permissions || []).map(normalizePermission));
};

const requireAnyPermission = (...requiredPermissions) => {
  const required = requiredPermissions.map(normalizePermission).filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required"));
    }

    const permissions = userPermissionSet(req.user);
    const allowed = required.some((permission) => permissions.has(permission));

    if (!allowed) {
      return next(new ApiError(403, "You do not have permission to access this resource"));
    }

    return next();
  };
};

const requirePermission = (permission) => requireAnyPermission(permission);

module.exports = {
  requirePermission,
  requireAnyPermission
};
