const { prisma } = require("../../../../database/prisma");

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email
    }
  });
};

const findEmployeeByCode = async (employeeCode) => {
  return prisma.employeeProfile.findUnique({
    where: {
      employeeCode
    }
  });
};

const findRoleByName = async (roleName) => {
  return prisma.role.findUnique({
    where: {
      roleName
    }
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
      }
    });

    await tx.adminProfile.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        office: data.office,
        photo: data.photo
      }
    });

    return user;

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

    await tx.employeeProfile.create({
      data: {
        userId: user.id,
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        department: data.department,
        designation: data.designation,
        joiningDate: data.joiningDate,
        photo: data.photo
      }
    });

    return user;

  });
};

module.exports = {
  findUserByEmail,
  findEmployeeByCode,
  findRoleByName,
  createAdmin,
  createEmployee
};