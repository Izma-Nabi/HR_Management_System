const { prisma } = require("../../../../database/prisma");

// The repository is the only layer that talks to the database.
// With Prisma, we write JavaScript queries instead of raw SQL strings.

// Select objects tell Prisma exactly which columns/fields we want.
// This prevents accidentally returning password_hash in API responses.
const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

// Login needs passwordHash to compare the submitted password.
// This select is used internally only and is never returned by controllers.
const userWithPasswordSelect = {
  ...safeUserSelect,
  passwordHash: true
};

const employeeProfileSelect = {
  id: true,
  userId: true,
  employeeCode: true,
  department: true,
  designation: true,
  biometricId: true,
  joiningDate: true,
  createdAt: true,
  updatedAt: true
};

const employeeAccountSelect = {
  ...safeUserSelect,
  employeeProfile: {
    select: employeeProfileSelect
  }
};

// Prisma returns user and employeeProfile nested together.
// The API should return them as two clear objects: user and employeeProfile.
const mapEmployeeAccount = (user) => {
  if (!user || !user.employeeProfile) {
    return null;
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    employeeProfile: user.employeeProfile
  };
};

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email
    },
    select: userWithPasswordSelect
  });
};

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: {
      id: Number(id)
    },
    select: safeUserSelect
  });
};

const findEmployeeAccountByUserId = async (userId, dbClient = prisma) => {
  const user = await dbClient.user.findFirst({
    where: {
      id: Number(userId),
      role: "EMPLOYEE"
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
