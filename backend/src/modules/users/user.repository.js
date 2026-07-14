const { prisma } = require("../../../../database/prisma");
const { roleNameCandidates, toRoleKey } = require("../../utils/roles");
const { generateNextEmployeeCode } = require("../../utils/employee-code");
const { generateNextAdminCode } = require("../../utils/admin-code");

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

const mapAdmin = (user) => {
  if (!user) {
    return null;
  }

  const assignment = firstDepartmentAssignment(user);

  return {
    id: user.id,
    userId: user.id,
    adminCode: user.userCode,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    address: user.address,
    departmentId: assignment?.departmentId || null,
    designation: user.designation,
    employmentStatus: user.employmentStatus,
    joiningDate: user.joiningDate,
    photo: user.photo,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    user: toSafeUser(user),
    department: assignment?.department || null
  };
};

const mapEmployeeUser = (user) => {
  if (!user) {
    return null;
  }

  const assignment = firstDepartmentAssignment(user);

  return {
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
    designation: user.designation,
    joiningDate: user.joiningDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const roleWhere = (roleName) => ({
  role: {
    roleName: {
      in: roleNameCandidates(roleName)
    }
  }
});

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email
    }
  });
};

const findRoleByName = async (roleName) => {
  return prisma.role.findFirst({
    where: {
      roleName: {
        in: roleNameCandidates(roleName)
      }
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

const replaceDepartmentAssignment = async (dbClient, userId, departmentId) => {
  await dbClient.adminDepartment.deleteMany({
    where: {
      userId: Number(userId)
    }
  });

  if (!departmentId) {
    return;
  }

  await dbClient.adminDepartment.create({
    data: {
      userId: Number(userId),
      departmentId: Number(departmentId)
    }
  });
};

const findAdminById = async (id, dbClient = prisma) => {
  const user = await dbClient.user.findFirst({
    where: {
      id: Number(id),
      ...roleWhere("ADMIN")
    },
    select: userProfileSelect
  });

  return mapAdmin(user);
};

const listAdmins = async () => {
  const admins = await prisma.user.findMany({
    where: roleWhere("ADMIN"),
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

  return admins.map(mapAdmin);
};

const createAdmin = async (data) => {
  return prisma.$transaction(async (tx) => {
    const adminCode = await generateNextAdminCode(tx);

    const user = await tx.user.create({
      data: {
        userCode: adminCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        address: data.address,
        photo: data.photo,
        designation: data.designation,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
        employmentStatus: data.employmentStatus || "ACTIVE",
        roleId: data.roleId,
        status: "ACTIVE"
      },
      select: {
        id: true
      }
    });

    await replaceDepartmentAssignment(tx, user.id, data.departmentId);

    return findAdminById(user.id, tx);
  });
};

const updateAdmin = async (id, data) => {
  return prisma.$transaction(async (tx) => {
    const existingAdmin = await findAdminById(id, tx);

    if (!existingAdmin) {
      return null;
    }

    const userData = {};

    if (data.firstName !== undefined) {
      userData.firstName = data.firstName;
    }

    if (data.lastName !== undefined) {
      userData.lastName = data.lastName;
    }

    if (data.email !== undefined) {
      userData.email = data.email;
    }

    if (data.passwordHash !== undefined) {
      userData.passwordHash = data.passwordHash;
    }

    if (data.phone !== undefined) {
      userData.phone = data.phone;
    }

    if (data.address !== undefined) {
      userData.address = data.address;
    }

    if (data.photo !== undefined) {
      userData.photo = data.photo;
    }

    if (data.designation !== undefined) {
      userData.designation = data.designation;
    }

    if (data.joiningDate !== undefined) {
      userData.joiningDate = data.joiningDate ? new Date(data.joiningDate) : null;
    }

    if (data.employmentStatus !== undefined) {
      userData.employmentStatus = data.employmentStatus;
    }

    if (data.status !== undefined) {
      userData.status = data.status;
    }

    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: {
          id: existingAdmin.userId
        },
        data: userData
      });
    }

    if (data.departmentId !== undefined) {
      await replaceDepartmentAssignment(tx, existingAdmin.userId, data.departmentId);
    }

    return findAdminById(existingAdmin.userId, tx);
  });
};

const deleteAdmin = async (id) => {
  return prisma.$transaction(async (tx) => {
    const existingAdmin = await findAdminById(id, tx);

    if (!existingAdmin) {
      return null;
    }

    await tx.user.delete({
      where: {
        id: existingAdmin.userId
      }
    });

    return existingAdmin;
  });
};

const createEmployee = async (data) => {
  return prisma.$transaction(async (tx) => {
    const employeeCode = await generateNextEmployeeCode(tx);

    const user = await tx.user.create({
      data: {
        userCode: employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        address: data.address,
        photo: data.photo,
        designation: data.designation,
        employmentStatus: data.employmentStatus || "ACTIVE",
        roleId: data.roleId,
        status: "ACTIVE"
      },
      select: {
        id: true
      }
    });

    await replaceDepartmentAssignment(tx, user.id, data.departmentId);

    return tx.user.findUnique({
      where: {
        id: user.id
      },
      select: userProfileSelect
    });
  });
};

module.exports = {
  findUserByEmail,
  findRoleByName,
  findDepartmentById,
  findAdminById,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  createEmployee,
  mapEmployeeUser,
  toSafeUser
};
