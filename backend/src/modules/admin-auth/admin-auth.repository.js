const { prisma } = require("../../../../database/prisma");
const { roleNameCandidates, toRoleKey } = require("../../utils/roles");
const { generateNextAdminCode } = require("../../utils/admin-code");

const adminRoles = ["SUPER ADMIN", "ADMIN"];

const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
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

const toSafeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: fullNameFromUser(user),
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

    return tx.user.create({
      data: {
        userCode: adminCode,
        firstName: name.firstName,
        lastName: name.lastName,
        email,
        passwordHash,
        roleId: adminRole.id,
        status: "ACTIVE"
      },
      select: safeUserSelect
    });
  });
};

module.exports = {
  findUserByEmail,
  findAdminByEmail,
  createAdmin,
  toSafeUser
};
