const { prisma } = require("../../../../database/prisma");

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
    role: user.role.roleName,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email
    },
    select: safeUserSelect
  });
};

const findAdminByEmail = async (email) => {
  return prisma.user.findFirst({
    where: {
      email,
      role: {
        roleName: {
          in: adminRoles
        }
      }
    },
    select: userWithPasswordSelect
  });
};

const createAdmin = async ({ fullName, email, passwordHash, roleId }) => {
  return prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      roleId,
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