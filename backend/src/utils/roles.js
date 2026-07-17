const ROLE_KEYS = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  EMPLOYEE: "EMPLOYEE"
};

const ROLE_NAME_ALIASES = {
  [ROLE_KEYS.SUPER_ADMIN]: ["SUPER_ADMIN", "SUPER ADMIN", "Super Admin"],
  [ROLE_KEYS.ADMIN]: ["ADMIN", "Admin"],
  [ROLE_KEYS.PROJECT_MANAGER]: ["PROJECT_MANAGER", "PROJECT MANAGER", "Project Manager"],
  [ROLE_KEYS.EMPLOYEE]: ["EMPLOYEE", "Employee"]
};

const toRoleKey = (role) => {
  if (!role) {
    return null;
  }

  const roleName = typeof role === "string" ? role : role.roleName;

  if (!roleName) {
    return null;
  }

  return roleName.trim().toUpperCase().replace(/\s+/g, "_");
};

const roleNameCandidates = (role) => {
  const roleKey = toRoleKey(role);

  if (!roleKey) {
    return [];
  }

  return ROLE_NAME_ALIASES[roleKey] || [roleKey];
};

module.exports = {
  ROLE_KEYS,
  toRoleKey,
  roleNameCandidates
};
