const { prisma } = require("../../../../database/prisma");
const { roleNameCandidates } = require("../../utils/roles");

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email
    }
  });
};

const findEmployeeByCode = async (employeeCode) => {
  return prisma.employee.findUnique({
    where: {
      employeeCode
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
        phone: data.phone
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

    await tx.employee.create({
      data: {
        userId: user.id,
        employeeCode: data.employeeCode,
        name: data.fullName,
        phone: data.phone,
        department: data.department,
        designation: data.designation
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
