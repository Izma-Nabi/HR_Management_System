const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, roleNameCandidates, toRoleKey } = require("../../utils/roles");
const { generateNextAdminCode } = require("../../utils/admin-code");

const safeUserSelect = {
  id: true,
  userCode: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  photo: true,
  designationId: true,
  designation: {
    select: {
      id: true,
      designationName: true
    }
  },
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

  if (!roleKey) {
    return [];
  }

  const permissions = new Set();
  const rolePermissions = role?.rolePermissions || [];

  for (const rolePermission of rolePermissions) {
    const permissionKey = toPermissionKey(rolePermission.permission?.permissionName);

    if (!permissionKey) {
      continue;
    }

    permissions.add(permissionKey);
  }

  return Array.from(permissions).sort();
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
    designationId: user.designationId,
    designation: user.designation?.designationName || null,
    joiningDate: user.joiningDate,
    role: toRoleKey(user.role),
    roleName: user.role?.roleName || null,
    status: user.employmentStatus,
    departmentId: user.departmentId,
    department: user.department || null,
    managedDepartments: user.department ? [user.department] : [],
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

const createPasswordResetToken = async ({
  userId,
  tokenHash,
  expiresAt
}) => {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });
};

const findPasswordResetToken = async (tokenHash) => {
  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });
};

const updateUserPassword = async (userId, passwordHash) => {
  return prisma.user.update({
    where: {
      id: Number(userId)
    },
    data: {
      passwordHash
    }
  });
};


const removePasswordResetToken = async (id) => {
  return prisma.passwordResetToken.delete({
    where: {
      id
    }
  });
};

const deletePasswordResetToken = async (userId) => {
  return prisma.passwordResetToken.deleteMany({
    where: {
      userId: Number(userId)
    }
  });
};

module.exports = {
  createAdmin,
  findUserByEmail,
  findUserById,
  toSafeUser,
  deletePasswordResetToken,
  createPasswordResetToken,
  findPasswordResetToken,
  updateUserPassword,
  removePasswordResetToken
};
