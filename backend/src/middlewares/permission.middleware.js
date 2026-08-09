const { ApiError } = require("../utils/apiResponse");

const normalizePermission = (permission) => {
  return String(permission || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
};

const normalizeRole = (role) => {
  return String(role || "").trim().toUpperCase().replace(/\s+/g, "_");
};

const isSuperAdminUser = (user) => {
  return normalizeRole(user?.role || user?.roleName) === "SUPER_ADMIN";
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

    if (isSuperAdminUser(req.user)) {
      return next();
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

const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication is required"));
  }

  if (!isSuperAdminUser(req.user)) {
    return next(new ApiError(403, "Super Admin access is required"));
  }

  return next();
};

const requireAnyRole = (...requiredRoles) => {
  const roles = requiredRoles.map(normalizeRole).filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required"));
    }

    const role = normalizeRole(req.user.role || req.user.roleName);

    if (!roles.includes(role)) {
      return next(new ApiError(403, "You do not have permission to access this resource"));
    }

    return next();
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireSuperAdmin,
  requireAnyRole
};
