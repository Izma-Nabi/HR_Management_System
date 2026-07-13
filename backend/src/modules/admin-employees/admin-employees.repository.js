const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, roleNameCandidates, toRoleKey } = require("../../utils/roles");
const { generateNextEmployeeCode } = require("../../utils/employee-code");

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

const findDepartmentById = async (id, dbClient = prisma) => {
  if (!id) {
    return null;
  }

  return dbClient.department.findUnique({
    where: {
      id: Number(id)
    },
    select: {
      id: true
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

      const employeeCode = await generateNextEmployeeCode(tx);

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

      return tx.employeeProfile.create({
        data: {
          userId: createdUser.id,
          employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
          address: employee.address,
          photo: employee.photo,
          departmentId: employee.departmentId ? Number(employee.departmentId) : null,
          designation: employee.designation
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
  findDepartmentById,
  createEmployeeAccount
};
