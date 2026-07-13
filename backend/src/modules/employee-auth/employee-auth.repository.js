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
  id: true,
  userId: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  phone: true,
  address: true,
  photo: true,
  departmentId: true,
  department: {
    select: {
      id: true,
      departmentName: true,
      description: true
    }
  },
  designation: true,
  joiningDate: true,
  createdAt: true,
  updatedAt: true
};

const employeeAccountSelect = {
  ...safeUserSelect,
  employeeProfile: {
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
  if (!user || !user.employeeProfile) {
    return null;
  }

  return {
    user: toSafeUser(user),
    employee: user.employeeProfile
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
