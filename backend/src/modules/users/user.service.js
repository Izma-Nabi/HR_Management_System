const bcrypt = require("bcrypt");
const repository = require("./user.repository");

const createAdmin = async (payload) => {

  const existingUser = await repository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const role = await repository.findRoleByName("Admin");

  if (!role) {
    throw new Error("Admin role not found");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  return repository.createAdmin({
    ...payload,
    passwordHash,
    roleId: role.id,
    photo: null
  });

};

const createEmployee = async (payload) => {

  const existingUser = await repository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const existingEmployee = await repository.findEmployeeByCode(
    payload.employeeCode
  );

  if (existingEmployee) {
    throw new Error("Employee code already exists");
  }

  const role = await repository.findRoleByName("Employee");

  if (!role) {
    throw new Error("Employee role not found");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  return repository.createEmployee({
    ...payload,
    passwordHash,
    roleId: role.id,
    photo: null
  });

};

module.exports = {
  createAdmin,
  createEmployee
};