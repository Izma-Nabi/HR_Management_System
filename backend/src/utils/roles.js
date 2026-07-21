const ROLE_KEYS = {
  SUPER_ADMIN: "SUPER_ADMIN",      // CEO
  ADMIN: "ADMIN",                  // HR
  PROJECT_MANAGER: "PROJECT_MANAGER",
  EMPLOYEE: "EMPLOYEE"
};

const ROLE_NAME_ALIASES = {
  [ROLE_KEYS.SUPER_ADMIN]: [
    "SUPER_ADMIN",
    "SUPER ADMIN",
    "Super Admin"
  ],

  [ROLE_KEYS.ADMIN]: [
    "ADMIN",
    "Admin",
    "HR",
    "Hr"
  ],

  [ROLE_KEYS.PROJECT_MANAGER]: [
    "PROJECT_MANAGER",
    "PROJECT MANAGER",
    "Project Manager"
  ],

  [ROLE_KEYS.EMPLOYEE]: [
    "EMPLOYEE",
    "Employee"
  ]
};

const DASHBOARD_BY_ROLE = {
  [ROLE_KEYS.SUPER_ADMIN]: "SUPER_ADMIN",
  [ROLE_KEYS.ADMIN]: "HR",
  [ROLE_KEYS.PROJECT_MANAGER]: "PROJECT_MANAGER",
  [ROLE_KEYS.EMPLOYEE]: "EMPLOYEE"
};

const LEAVE_APPROVAL_LEVEL = {
  [ROLE_KEYS.PROJECT_MANAGER]: 1,
  [ROLE_KEYS.ADMIN]: 2,
  [ROLE_KEYS.SUPER_ADMIN]: 3
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

  return roleName
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
};

const roleNameCandidates = (role) => {
  const roleKey = toRoleKey(role);

  if (!roleKey) {
    return [];
  }

  return ROLE_NAME_ALIASES[roleKey] || [roleKey];
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

const isProjectManager = (role) =>
  toRoleKey(role) === ROLE_KEYS.PROJECT_MANAGER;

const isEmployee = (role) =>
  toRoleKey(role) === ROLE_KEYS.EMPLOYEE;

module.exports = {
  ROLE_KEYS,
  ROLE_NAME_ALIASES,
  DASHBOARD_BY_ROLE,
  LEAVE_APPROVAL_LEVEL,
  toRoleKey,
  roleNameCandidates,
  getDashboardByRole,
  getApprovalLevel,
  isSuperAdmin,
  isAdmin,
  isProjectManager,
  isEmployee
};