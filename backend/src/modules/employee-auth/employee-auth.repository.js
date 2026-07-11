const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, roleNameCandidates, toRoleKey } = require("../../utils/roles");

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

const employeeSelect = {
  employeeId: true,
  userId: true,
  employeeCode: true,
  name: true,
  phone: true,
  department: true,
  designation: true,
  fingerprintId: true,
  employmentStatus: true,
  joiningDate: true,
  createdAt: true,
  updatedAt: true
};

const employeeAccountSelect = {
  ...safeUserSelect,
  employee: {
    select: employeeSelect
  }
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

const mapEmployeeAccount = (user) => {
  if (!user || !user.employee) {
    return null;
  }

  return {
    user: toSafeUser(user),
    employee: user.employee
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

const findEmployeeAccountByUserId = async (userId, dbClient = prisma) => {
  const user = await dbClient.user.findFirst({
    where: {
      id: Number(userId),
      role: {
        roleName: {
          in: roleNameCandidates(ROLE_KEYS.EMPLOYEE)
        }
      }
    },
    select: employeeAccountSelect
  });

  return mapEmployeeAccount(user);
};

module.exports = {
  findUserByEmail,
  findUserById,
  findEmployeeAccountByUserId
};
