const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, roleNameCandidates, toRoleKey } = require("../../utils/roles");
const { generateNextEmployeeCode } = require("../../utils/employee-code");

const userProfileSelect = {
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

  status: true,

  departmentId: true,

  createdAt: true,
  updatedAt: true,

  role: {
    select: {
      id: true,
      roleName: true
    }
  },

  department: {
    select: {
      id: true,
      departmentName: true,
      description: true
    }
  }
};

const fullNameFromUser = (user) => {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
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

const mapEmployeeAccount = (user) => {
  if (!user) {
    return null;
  }


  return {
    user: toSafeUser(user),
    employee: {
      id: user.id,
      userId: user.id,
      employeeCode: user.userCode,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      photo: user.photo,
      departmentId: user.departmentId,
      department: user.department,
      designation: user.designation,
      joiningDate: user.joiningDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
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


const listEmployeeAccounts = async () => {
  const employees = await prisma.user.findMany({
    where: {
      role: {
        roleName: {
          in: roleNameCandidates(ROLE_KEYS.EMPLOYEE)
        }
      }
    },
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ],
    select: userProfileSelect
  });

  return employees.map(mapEmployeeAccount);
};

const createEmployeeAccount = async ({ user, employee }) => {
  const createdUser = await prisma.$transaction(
    async (tx) => {
      const employeeRole = await findEmployeeRole(tx);

      if (!employeeRole) {
        throw new Error("Employee role is not configured");
      }

      const employeeCode = await generateNextEmployeeCode(tx);

      const created = await tx.user.create({
    data: {
        userCode: employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: user.email,
        passwordHash: user.passwordHash,
        phone: employee.phone,
        address: employee.address,
        photo: employee.photo,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        employmentStatus: "ACTIVE",

        roleId: employeeRole.id,

        departmentId: employee.departmentId
            ? Number(employee.departmentId)
            : null,

          status: "ACTIVE"
          },
          select: {
              id: true
          }
      });

      return tx.user.findUnique({
        where: {
          id: created.id
        },
        select: userProfileSelect
      });
    },
    {
      maxWait: 10000,
      timeout: 20000
    }
  );

  return mapEmployeeAccount(createdUser);
};

module.exports = {
  findUserByEmail,
  findDepartmentById,
  listEmployeeAccounts,
  createEmployeeAccount
};
