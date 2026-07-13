const { prisma } = require("../../../../database/prisma");
const { roleNameCandidates } = require("../../utils/roles");
const { generateNextEmployeeCode } = require("../../utils/employee-code");
const { generateNextAdminCode } = require("../../utils/admin-code");

const adminProfileSelect = {
  id: true,
  userId: true,
  adminCode: true,
  firstName: true,
  lastName: true,
  phone: true,
  address: true,
  departmentId: true,
  designation: true,
  employmentStatus: true,
  joiningDate: true,
  photo: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      createdAt: true,
      updatedAt: true
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

const findAdminById = async (id, dbClient = prisma) => {
  return dbClient.adminProfile.findUnique({
    where: {
      id: Number(id)
    },
    select: adminProfileSelect
  });
};

const listAdmins = async () => {
  return prisma.adminProfile.findMany({
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ],
    select: adminProfileSelect
  });
};

const createAdmin = async (data) => {
  return prisma.$transaction(async (tx) => {

    const user = await tx.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        status: "ACTIVE"
      },
      select: {
        id: true
      }
    });

    const adminCode = await generateNextAdminCode(tx);

    const admin = await tx.adminProfile.create({
      data: {
        userId: user.id,
        adminCode,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        departmentId: data.departmentId ? Number(data.departmentId) : null,
        designation: data.designation,
        employmentStatus: data.employmentStatus || "Active",
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
        photo: data.photo
      },
      select: {
        id: true
      }
    });

    return findAdminById(admin.id, tx);

  });
};

const updateAdmin = async (id, data) => {
  return prisma.$transaction(async (tx) => {

    const existingAdmin = await findAdminById(id, tx);

    if (!existingAdmin) {
      return null;
    }

    const userData = {};
    const profileData = {};

    if (data.fullName !== undefined) {
      userData.fullName = data.fullName;
    }

    if (data.email !== undefined) {
      userData.email = data.email;
    }

    if (data.passwordHash !== undefined) {
      userData.passwordHash = data.passwordHash;
    }

    if (data.status !== undefined) {
      userData.status = data.status;
    }

    if (data.firstName !== undefined) {
      profileData.firstName = data.firstName;
    }

    if (data.lastName !== undefined) {
      profileData.lastName = data.lastName;
    }

    if (data.phone !== undefined) {
      profileData.phone = data.phone;
    }

    if (data.address !== undefined) {
      profileData.address = data.address;
    }

    if (data.departmentId !== undefined) {
      profileData.departmentId = data.departmentId ? Number(data.departmentId) : null;
    }

    if (data.designation !== undefined) {
      profileData.designation = data.designation;
    }

    if (data.employmentStatus !== undefined) {
      profileData.employmentStatus = data.employmentStatus;
    }

    if (data.joiningDate !== undefined) {
      profileData.joiningDate = data.joiningDate ? new Date(data.joiningDate) : null;
    }

    if (data.photo !== undefined) {
      profileData.photo = data.photo;
    }

    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: {
          id: existingAdmin.userId
        },
        data: userData
      });
    }

    if (Object.keys(profileData).length > 0) {
      await tx.adminProfile.update({
        where: {
          id: existingAdmin.id
        },
        data: profileData
      });
    }

    return findAdminById(existingAdmin.id, tx);

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

    const user = await tx.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        status: "ACTIVE"
      }
    });

    const employeeCode = await generateNextEmployeeCode(tx);

    await tx.employeeProfile.create({
      data: {
        userId: user.id,
        employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        photo: data.photo,
        departmentId: data.departmentId ? Number(data.departmentId) : null,
        designation: data.designation
      }
    });

    return user;

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
  createEmployee
};
