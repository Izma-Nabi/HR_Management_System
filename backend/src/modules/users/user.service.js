const { ApiError } = require("../../utils/apiResponse");
const { hashPassword } = require("../../utils/password");
const { ROLE_KEYS, toRoleKey } = require("../../utils/roles");
const repository = require("./user.repository");

const parseAdminId = (id) => {
  const adminId = Number(id);

  if (!Number.isInteger(adminId) || adminId <= 0) {
    throw new ApiError(400, "Invalid admin id");
  }

  return adminId;
};

const parseUserId = (id) => {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiError(400, "Invalid user id");
  }

  return userId;
};

const buildFullName = ({ firstName, lastName }) => {
  return `${firstName || ""} ${lastName || ""}`.trim();
};

const normalizeEmploymentStatus = (value) => {
  if (!value) {
    return "ACTIVE";
  }

  return String(value).trim().toUpperCase().replace(/\s+/g, "_");
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

const ensureDesignationMatchesDepartment = async (designationId, departmentId) => {
  if (!designationId) {
    throw new ApiError(400, "Designation is required");
  }

  const designation = await repository.findDesignationById(designationId);

  if (!designation) {
    throw new ApiError(400, "Designation not found");
  }

  if (designation.departmentId !== Number(departmentId)) {
    throw new ApiError(
      400,
      "Designation does not belong to the selected department"
    );
  }

  return designation;
};

const permissionSetFromUser = (user) => {
  return new Set(
    (user?.permissions || []).map((permission) =>
      String(permission || "").trim().toUpperCase().replace(/[\s-]+/g, "_")
    )
  );
};

const ensureCanManageRole = (actor, roleKey, action) => {
  const permissions = permissionSetFromUser(actor);
  const permission = roleKey === ROLE_KEYS.EMPLOYEE
    ? `${action}_EMPLOYEE`
    : `${action}_ADMIN`;

  if (!permissions.has(permission)) {
    throw new ApiError(403, `You do not have permission to ${action.toLowerCase()} this user`);
  }
};

const ensureAdminExists = async (id) => {
  const adminId = parseAdminId(id);
  const admin = await repository.findAdminById(adminId);

  if (!admin) {
    throw new ApiError(404, "Administrator not found");
  }

  return admin;
};

const ensureUserExists = async (id) => {
  const userId = parseUserId(id);
  const user = await repository.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
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

  const designationId = payload.designationId ?? payload.designation;

  if (designationId) {
    await ensureDesignationMatchesDepartment(
      designationId,
      payload.departmentId
    );
  }

  const passwordHash = await hashPassword(payload.password);

  return repository.createAdmin({
    ...payload,
    employmentStatus: normalizeEmploymentStatus(payload.employmentStatus),
    passwordHash,
    roleId: role.id
  });
};

const createUser = async (payload, actor) => {
  const existingUser = await repository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const role = await repository.findRoleById(payload.roleId);
  const roleKey = toRoleKey(role);

  if (!role || !roleKey) {
    throw new ApiError(400, "Invalid role");
  }

  ensureCanManageRole(actor, roleKey, "CREATE");

  let departmentId = payload.departmentId;
  let designationId = payload.designationId;

  if (roleKey === ROLE_KEYS.SUPER_ADMIN) {
    departmentId = null;
    designationId = null;
  } else {
    if (!departmentId) {
      throw new ApiError(400, "Department is required");
    }

    await ensureDepartmentExists(departmentId);
    await ensureDesignationMatchesDepartment(designationId, departmentId);
  }

  const passwordHash = await hashPassword(payload.password);

  return repository.createUser({
    ...payload,
    roleKey,
    departmentId,
    designationId,
    employmentStatus: normalizeEmploymentStatus(payload.employmentStatus),
    passwordHash
  });
};


const listAdmins = async () => {
  return repository.listAdmins();
};

const listUsers = async () => {
  return repository.listUsers();
};

const getUser = async (id) => {
  return ensureUserExists(id);
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

  const departmentId =
    payload.departmentId !== undefined
      ? payload.departmentId
      : admin.departmentId;
  const designationId =
    payload.designationId !== undefined
      ? payload.designationId
      : payload.designation !== undefined
        ? payload.designation
        : admin.designationId;

  if (
    designationId
    && (
      payload.departmentId !== undefined
      || payload.designationId !== undefined
      || payload.designation !== undefined
    )
  ) {
    await ensureDesignationMatchesDepartment(designationId, departmentId);
  }

  const data = { ...payload };
  delete data.password;

  if (data.employmentStatus !== undefined) {
    data.employmentStatus = normalizeEmploymentStatus(data.employmentStatus);
  }

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

const updateUser = async (id, payload) => {
  const user = await ensureUserExists(id);

  if (payload.email && payload.email !== user.email) {
    const existingUser = await repository.findUserByEmail(payload.email);

    if (existingUser && existingUser.id !== user.id) {
      throw new ApiError(409, "Email already exists");
    }
  }

  if (payload.departmentId !== undefined && payload.departmentId !== null) {
    await ensureDepartmentExists(payload.departmentId);
  }

  const roleKey = payload.role || user.role;
  const role = await repository.findRoleByName(roleKey);

  if (!role) {
    throw new ApiError(400, "Role not found");
  }

  const designationId =
    payload.designationId !== undefined
      ? payload.designationId
      : payload.designation !== undefined
        ? payload.designation
        : user.designationId;
  const departmentId =
    payload.departmentId !== undefined
      ? payload.departmentId
      : user.departmentId;
  const profileAssignmentChanged =
    payload.role !== undefined
    || payload.departmentId !== undefined
    || payload.designationId !== undefined
    || payload.designation !== undefined;

  const data = {
    ...payload,
    roleId: role.id
  };

  delete data.password;
  delete data.role;
  delete data.managedDepartmentIds;
  delete data.designation;

  if (roleKey === ROLE_KEYS.SUPER_ADMIN) {
    data.departmentId = null;
    data.designationId = null;
  } else if (profileAssignmentChanged) {
    if (!departmentId) {
      throw new ApiError(400, "Department is required");
    }

    await ensureDepartmentExists(departmentId);
    await ensureDesignationMatchesDepartment(designationId, departmentId);
    data.designationId = Number(designationId);
  }

  if (data.employmentStatus !== undefined) {
    data.employmentStatus = normalizeEmploymentStatus(data.employmentStatus);
  }

  if (payload.password) {
    data.passwordHash = await hashPassword(payload.password);
  }

  return repository.updateUser(user.id, data);
};

const deleteUser = async (id, actor) => {
  const user = await ensureUserExists(id);

  ensureCanManageRole(actor, user.role, "DELETE");

  return repository.deleteUser(user.id);
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

  const designationId = payload.designationId ?? payload.designation;

  if (designationId) {
    await ensureDesignationMatchesDepartment(
      designationId,
      payload.departmentId
    );
  }

  const passwordHash = await hashPassword(payload.password);
  const fullName = payload.fullName || buildFullName(payload);

  return repository.createEmployee({
    ...payload,
    employmentStatus: normalizeEmploymentStatus(payload.employmentStatus),
    fullName,
    passwordHash,
    roleId: role.id
  });
};

module.exports = {
  createUser,
  createAdmin,
  listAdmins,
  listUsers,
  getUser,
  getAdmin,
  updateAdmin,
  updateUser,
  deleteUser,
  deleteAdmin,
  createEmployee
};
