const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, roleNameCandidates, toRoleKey } = require("../../utils/roles");

const safeUserSelect = {
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
  status: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      roleName: true
    }
  },
  adminDepartments: {
    select: {
      departmentId: true,
      department: {
        select: {
          id: true,
          departmentName: true,
          description: true
        }
      }
    },
    take: 1
  }
};

const userWithPasswordSelect = {
  ...safeUserSelect,
  passwordHash: true
};

const fullNameFromUser = (user) => {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
};

const firstDepartmentAssignment = (user) => {
  return user?.adminDepartments?.[0] || null;
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

const mapEmployeeAccount = (user) => {
  if (!user) {
    return null;
  }

  const managedDepartments = user.adminDepartments || [];
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
      departmentId: assignment?.departmentId || null,
      department: assignment?.department || null,
      managedDepartments:user.adminDepartments.map(item=>item.department),
      designation: user.designation,
      joiningDate: user.joiningDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
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
    select: safeUserSelect
  });

  return mapEmployeeAccount(user);
};

module.exports = {
  findUserByEmail,
  findUserById,
  findEmployeeAccountByUserId
};
