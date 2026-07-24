const ROLE_KEYS = {
  SUPER_ADMIN: "SUPER_ADMIN",      
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE"
};

const ROLE_NAME_ALIASES = {
  [ROLE_KEYS.SUPER_ADMIN]: [
    "Super Admin",
    "SUPER_ADMIN",
    "SUPER ADMIN"
  ],

  [ROLE_KEYS.ADMIN]: [
    "Admin",
    "ADMIN"
  ],

  [ROLE_KEYS.EMPLOYEE]: [
    "Employee",
    "EMPLOYEE"
  ]
};

const normalizeRoleName = (roleName) => {
  return String(roleName || "").trim().toUpperCase().replace(/\s+/g, "_");
};

const ROLE_KEY_BY_ALIAS = Object.entries(ROLE_NAME_ALIASES).reduce(
  (aliases, [roleKey, roleNames]) => {
    for (const roleName of roleNames) {
      aliases[normalizeRoleName(roleName)] = roleKey;
    }

    return aliases;
  },
  {}
);

const DASHBOARD_BY_ROLE = {
  [ROLE_KEYS.SUPER_ADMIN]: "SUPER_ADMIN",
  [ROLE_KEYS.ADMIN]: "ADMIN",
  [ROLE_KEYS.EMPLOYEE]: "EMPLOYEE"
};

const LEAVE_APPROVAL_LEVEL = {
  [ROLE_KEYS.ADMIN]: 1,
  [ROLE_KEYS.SUPER_ADMIN]: 2
};

const toRoleKey = (role) => {
  if (!role) {
    return null;
  }

  const roleName =
    typeof role === "string"
      ? role
      : role.roleName;

  if (!roleName) {
    return null;
  }

  return ROLE_KEY_BY_ALIAS[normalizeRoleName(roleName)] || null;
};

const roleNameCandidates = (role) => {
  const roleKey = toRoleKey(role);

  if (!roleKey) {
    return [];
  }

  return ROLE_NAME_ALIASES[roleKey] || [];
};

const getDashboardByRole = (role) => {
  const roleKey = toRoleKey(role);

  if (!roleKey) {
    return null;
  }

  return DASHBOARD_BY_ROLE[roleKey] || null;
};

const getApprovalLevel = (role) => {
  const roleKey = toRoleKey(role);

  if (!roleKey) {
    return null;
  }

  return LEAVE_APPROVAL_LEVEL[roleKey] || null;
};

const isSuperAdmin = (role) =>
  toRoleKey(role) === ROLE_KEYS.SUPER_ADMIN;

const isAdmin = (role) =>
  toRoleKey(role) === ROLE_KEYS.ADMIN;

const isEmployee = (role) =>
  toRoleKey(role) === ROLE_KEYS.EMPLOYEE;

module.exports = {
  ROLE_KEYS,
  ROLE_NAME_ALIASES,
  DASHBOARD_BY_ROLE,
  LEAVE_APPROVAL_LEVEL,
  normalizeRoleName,
  toRoleKey,
  roleNameCandidates,
  getDashboardByRole,
  getApprovalLevel,
  isSuperAdmin,
  isAdmin,
  isEmployee
};
