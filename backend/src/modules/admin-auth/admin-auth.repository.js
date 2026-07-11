const { prisma } = require("../../../../database/prisma");
const { roleNameCandidates, toRoleKey } = require("../../utils/roles");

const adminRoles = ["SUPER ADMIN", "ADMIN"];

const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: {
    select: {
      id: true,
      roleName: true
    }
  },
  status: true,
  createdAt: true,
  updatedAt: true
};

const userWithPasswordSelect = {
  ...safeUserSelect,
  passwordHash: true
};

const toSafeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: toRoleKey(user.role),
    status: user.status,
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
    select: safeUserSelect
  });

  return toSafeUser(user);
};

const findAdminByEmail = async (email) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
      role: {
        roleName: {
          in: adminRoles.flatMap(roleNameCandidates)
        }
      }
    },
    select: userWithPasswordSelect
  });

  return toUserWithPassword(user);
};

const createAdmin = async ({ fullName, email, passwordHash, role }) => {
  const adminRole = await prisma.role.findFirst({
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

  return prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      roleId: adminRole.id,
      status: "ACTIVE"
    },
    select: safeUserSelect
  });
};

module.exports = {
  findUserByEmail,
  findAdminByEmail,
  createAdmin,
  toSafeUser
};
