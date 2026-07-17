const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, roleNameCandidates, toRoleKey } = require("../../utils/roles");
const { generateNextAdminCode } = require("../../utils/admin-code");

const ROLE_PERMISSION_FALLBACKS = {
  [ROLE_KEYS.SUPER_ADMIN]: [
    "MANAGE_ADMINS",
    "MANAGE_DEPARTMENTS",
    "MANAGE_EMPLOYEES",
    "VIEW_SYSTEM_SUMMARY",
    "VIEW_TEAM_ATTENDANCE",
    "VIEW_OWN_ATTENDANCE",
    "VIEW_REPORTS"
  ],
  [ROLE_KEYS.ADMIN]: [
    "MANAGE_EMPLOYEES",
    "VIEW_SYSTEM_SUMMARY",
    "VIEW_REPORTS"
  ],
  [ROLE_KEYS.PROJECT_MANAGER]: [
    "VIEW_TEAM_ATTENDANCE"
  ],
  [ROLE_KEYS.EMPLOYEE]: [
    "VIEW_OWN_ATTENDANCE"
  ]
};

const LEGACY_PERMISSION_MAP = {
  CREATE_ADMIN: "MANAGE_ADMINS",
  EDIT_ADMIN: "MANAGE_ADMINS",
  DELETE_ADMIN: "MANAGE_ADMINS",
  CREATE_EMPLOYEE: "MANAGE_EMPLOYEES",
  EDIT_EMPLOYEE: "MANAGE_EMPLOYEES",
  DELETE_EMPLOYEE: "MANAGE_EMPLOYEES",
  VIEW_REPORTS: "VIEW_SYSTEM_SUMMARY"
};

const safeUserSelect = {
  id: true,
  userCode: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  photo: true,
  designation: true,
  joiningDate: true,
  employmentStatus: true,
  departmentId: true,
  department: {
    select: {
      id: true,
      departmentName: true,
      description: true
    }
  },
  role: {
    select: {
      id: true,
      roleName: true,
      rolePermissions: {
        select: {
          permission: {
            select: {
              id: true,
              permissionName: true
            }
          }
        }
      }
    }
  },
  adminDepartments: {
    select: {
      departmentId: true,
      department: {
        select: {
          id: true,
          departmentName: true,
          description: true
        }
      }
    }
  },
  createdAt: true,
  updatedAt: true
};

const userWithPasswordSelect = {
  ...safeUserSelect,
  passwordHash: true
};

const fullNameFromUser = (user) => {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
};

const splitFullName = (fullName) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";

  return {
    firstName,
    lastName: parts.join(" ") || null
  };
};

const toPermissionKey = (permissionName) => {
  if (!permissionName) {
    return null;
  }

  return String(permissionName).trim().toUpperCase().replace(/[\s-]+/g, "_");
};

const permissionsFromRole = (role) => {
  const roleKey = toRoleKey(role);
  const permissions = new Set(ROLE_PERMISSION_FALLBACKS[roleKey] || []);
  const rolePermissions = role?.rolePermissions || [];

  for (const rolePermission of rolePermissions) {
    const permissionKey = toPermissionKey(rolePermission.permission?.permissionName);

    if (!permissionKey) {
      continue;
    }

    permissions.add(permissionKey);

    const appPermission = LEGACY_PERMISSION_MAP[permissionKey];

    if (appPermission) {
      permissions.add(appPermission);
    }
  }

  return Array.from(permissions).sort();
};

const mapManagedDepartments = (user) => {
  return (user?.adminDepartments || [])
    .map((assignment) => assignment.department)
    .filter(Boolean);
};

const toSafeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    userCode: user.userCode,
    fullName: fullNameFromUser(user),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    photo: user.photo,
    designation: user.designation,
    joiningDate: user.joiningDate,
    role: toRoleKey(user.role),
    roleName: user.role?.roleName || null,
    status: user.employmentStatus,
    departmentId: user.departmentId,
    department: user.department || null,
    managedDepartments: mapManagedDepartments(user),
    permissions: permissionsFromRole(user.role),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const toUserWithPassword = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...toSafeUser(user),
    passwordHash: user.passwordHash
  };
};

const findUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: userWithPasswordSelect
  });

  return toUserWithPassword(user);
};

const findUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(id)
    },
    select: safeUserSelect
  });

  return toSafeUser(user);
};

const createAdmin = async ({ fullName, email, passwordHash, role }) => {
  return prisma.$transaction(async (tx) => {
    const adminRole = await tx.role.findFirst({
      where: {
        roleName: {
          in: roleNameCandidates(role)
        }
      },
      select: {
        id: true
      }
    });

    if (!adminRole) {
      throw new Error(`Role not found: ${role}`);
    }

    const name = splitFullName(fullName);
    const adminCode = await generateNextAdminCode(tx);

    const user = await tx.user.create({
      data: {
        userCode: adminCode,
        firstName: name.firstName,
        lastName: name.lastName,
        email,
        passwordHash,
        roleId: adminRole.id,
        employmentStatus: "ACTIVE"
      },
      select: {
        id: true
      }
    });

    return tx.user.findUnique({
      where: {
        id: user.id
      },
      select: safeUserSelect
    });
  });
};

module.exports = {
  createAdmin,
  findUserByEmail,
  findUserById,
  toSafeUser
};
