const { prisma } = require("../../../../database/prisma");

const adminRoles = ["SUPER_ADMIN", "ADMIN"];

const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
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
    role: user.role,
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
        in: adminRoles
      }
    },
    select: userWithPasswordSelect
  });
};

const createAdmin = async ({ fullName, email, passwordHash, role }) => {
  return prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role,
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
