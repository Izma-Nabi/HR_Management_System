const { ApiError } = require("../../utils/apiResponse");
const { hashPassword } = require("../../utils/password");
const repository = require("./user.repository");

const parseAdminId = (id) => {
  const adminId = Number(id);

  if (!Number.isInteger(adminId) || adminId <= 0) {
    throw new ApiError(400, "Invalid admin id");
  }

  return adminId;
};

const buildFullName = ({ firstName, lastName }) => {
  return `${firstName || ""} ${lastName || ""}`.trim();
};

const ensureDepartmentExists = async (departmentId) => {
  if (!departmentId) {
    return null;
  }

  const department = await repository.findDepartmentById(departmentId);

  if (!department) {
    throw new ApiError(400, "Department not found");
  }

  return department;
};

const ensureAdminExists = async (id) => {
  const adminId = parseAdminId(id);
  const admin = await repository.findAdminById(adminId);

  if (!admin) {
    throw new ApiError(404, "Administrator not found");
  }

  return admin;
};

const createAdmin = async (payload) => {
  const existingUser = await repository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const role = await repository.findRoleByName("ADMIN");

  if (!role) {
    throw new ApiError(500, "Admin role not found");
  }

  await ensureDepartmentExists(payload.departmentId);

  const passwordHash = await hashPassword(payload.password);
  const fullName = buildFullName(payload);

  return repository.createAdmin({
    ...payload,
    fullName,
    passwordHash,
    roleId: role.id
  });
};

const listAdmins = async () => {
  return repository.listAdmins();
};

const getAdmin = async (id) => {
  return ensureAdminExists(id);
};

const updateAdmin = async (id, payload) => {
  const admin = await ensureAdminExists(id);

  if (payload.email && payload.email !== admin.user.email) {
    const existingUser = await repository.findUserByEmail(payload.email);

    if (existingUser) {
      throw new ApiError(409, "Email already exists");
    }
  }

  if (payload.departmentId !== undefined && payload.departmentId !== null) {
    await ensureDepartmentExists(payload.departmentId);
  }

  const data = { ...payload };
  delete data.password;

  const firstName = data.firstName !== undefined ? data.firstName : admin.firstName;
  const lastName = data.lastName !== undefined ? data.lastName : admin.lastName;

  if (data.firstName !== undefined || data.lastName !== undefined) {
    data.fullName = buildFullName({ firstName, lastName });
  }

  if (payload.password) {
    data.passwordHash = await hashPassword(payload.password);
  }

  return repository.updateAdmin(admin.id, data);
};

const deleteAdmin = async (id) => {
  const admin = await ensureAdminExists(id);

  return repository.deleteAdmin(admin.id);
};

const createEmployee = async (payload) => {
  const existingUser = await repository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const role = await repository.findRoleByName("EMPLOYEE");

  if (!role) {
    throw new ApiError(500, "Employee role not found");
  }

  await ensureDepartmentExists(payload.departmentId);

  const passwordHash = await hashPassword(payload.password);
  const fullName = payload.fullName || buildFullName(payload);

  return repository.createEmployee({
    ...payload,
    fullName,
    passwordHash,
    roleId: role.id
  });
};

module.exports = {
  createAdmin,
  listAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  createEmployee
};
