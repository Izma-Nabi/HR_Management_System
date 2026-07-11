const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, roleNameCandidates, toRoleKey } = require("../../utils/roles");

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
  createdAt: true,
  updatedAt: true
};

const userSelect = {
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

const employeeAccountSelect = {
  ...employeeSelect,
  user: {
    select: userSelect
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

const mapEmployeeAccount = (employee) => {
  if (!employee) {
    return null;
  }

  const { user, ...employeeData } = employee;

  return {
    user: toSafeUser(user),
    employee: employeeData
  };
};

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true
    }
  });
};

const findEmployeeByCode = async (employeeCode) => {
  return prisma.employee.findUnique({
    where: {
      employeeCode
    },
    select: {
      employeeId: true
    }
  });
};

const findEmployeeByFingerprintId = async (fingerprintId) => {
  if (!fingerprintId) {
    return null;
  }

  return prisma.employee.findUnique({
    where: {
      fingerprintId
    },
    select: {
      employeeId: true
    }
  });
};

const findEmployeeRole = async (dbClient = prisma) => {
  return dbClient.role.findFirst({
    where: {
      roleName: {
        in: roleNameCandidates(ROLE_KEYS.EMPLOYEE)
      }
    },
    select: {
      id: true
    }
  });
};

const createEmployeeAccount = async ({ user, employee }) => {
  const createdEmployee = await prisma.$transaction(
    async (tx) => {
      const employeeRole = await findEmployeeRole(tx);

      if (!employeeRole) {
        throw new Error("Employee role is not configured");
      }

      const createdUser = await tx.user.create({
        data: {
          fullName: user.fullName,
          email: user.email,
          passwordHash: user.passwordHash,
          roleId: employeeRole.id,
          status: "ACTIVE"
        },
        select: {
          id: true
        }
      });

      return tx.employee.create({
        data: {
          userId: createdUser.id,
          employeeCode: employee.employeeCode,
          name: employee.name,
          phone: employee.phone,
          department: employee.department,
          designation: employee.designation,
          fingerprintId: employee.fingerprintId,
          employmentStatus: employee.employmentStatus
        },
        select: employeeAccountSelect
      });
    },
    {
      maxWait: 10000,
      timeout: 20000
    }
  );

  return mapEmployeeAccount(createdEmployee);
};

module.exports = {
  findUserByEmail,
  findEmployeeByCode,
  findEmployeeByFingerprintId,
  createEmployeeAccount
};
