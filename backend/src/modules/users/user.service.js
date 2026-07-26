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

const normalizeKey = (value) => {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
};

const hasPermission = (actor, permission) => {
  const permissions = Array.isArray(actor?.permissions) ? actor.permissions : [];

  return permissions
    .map(normalizeKey)
    .includes(normalizeKey(permission));
};

const requireCreatePermission = (actor, roleKey) => {
  const permissionByRole = {
    [ROLE_KEYS.ADMIN]: "CREATE_ADMIN",
    [ROLE_KEYS.EMPLOYEE]: "CREATE_EMPLOYEE"
  };

  const requiredPermission = permissionByRole[roleKey];

  if (!requiredPermission || !hasPermission(actor, requiredPermission)) {
    throw new ApiError(403, "You do not have permission to create this user type");
  }
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

const findDesignationFromPayload = async (payload, departmentId) => {
  const designationId = payload.designationId ?? null;

  if (designationId) {
    return repository.findDesignationById(designationId);
  }

  const designation = payload.designation ?? null;

  if (!designation) {
    return null;
  }

  const numericDesignation = Number(designation);

  if (Number.isInteger(numericDesignation) && numericDesignation > 0) {
    return repository.findDesignationById(numericDesignation);
  }

  if (departmentId) {
    return repository.findDesignationByNameAndDepartment(designation, departmentId);
  }

  return repository.findDesignationByName(designation);
};

const ensureDesignationBelongsToDepartment = async (
  payload,
  departmentId,
  { required = true } = {}
) => {
  const designation = await findDesignationFromPayload(payload, departmentId);

  if (!designation) {
    if (required) {
      throw new ApiError(400, "Designation is required");
    }

    return null;
  }

  if (Number(designation.departmentId) !== Number(departmentId)) {
    throw new ApiError(400, "Designation does not belong to the selected department");
  }

  return designation;
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
  const designation = await ensureDesignationBelongsToDepartment(payload, payload.departmentId);

  const passwordHash = await hashPassword(payload.password);

  return repository.createAdmin({
    ...payload,
    employmentStatus: normalizeEmploymentStatus(payload.employmentStatus),
    designationId: designation.id,
    passwordHash,
    roleId: role.id
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

  const data = { ...payload };
  delete data.password;
  delete data.designation;

  if (payload.designationId !== undefined || payload.designation !== undefined) {
    const departmentId = payload.departmentId !== undefined
      ? payload.departmentId
      : admin.departmentId;
    const designation = await ensureDesignationBelongsToDepartment(
      payload,
      departmentId,
      { required: payload.designationId !== null && payload.designation !== null }
    );

    data.designationId = designation?.id || null;
  } else if (payload.departmentId !== undefined) {
    data.designationId = null;
  }

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

  const data = {
    ...payload,
    roleId: role.id
  };
  const hasDesignationInput = payload.designationId !== undefined || payload.designation !== undefined;

  if (hasDesignationInput) {
    const departmentId = payload.departmentId !== undefined
      ? payload.departmentId
      : user.departmentId;
    const designation = await ensureDesignationBelongsToDepartment(
      payload,
      departmentId,
      { required: payload.designationId !== null && payload.designation !== null }
    );

    data.designationId = designation?.id || null;
  } else if (payload.departmentId !== undefined) {
    data.designationId = null;
  }

  delete data.password;
  delete data.role;
  delete data.designation;
  delete data.managedDepartmentIds;

  if (data.employmentStatus !== undefined) {
    data.employmentStatus = normalizeEmploymentStatus(data.employmentStatus);
  }

  if (payload.password) {
    data.passwordHash = await hashPassword(payload.password);
  }

  return repository.updateUser(user.id, data);
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
  const designation = await ensureDesignationBelongsToDepartment(payload, payload.departmentId);

  const passwordHash = await hashPassword(payload.password);
  const fullName = payload.fullName || buildFullName(payload);

  return repository.createEmployee({
    ...payload,
    employmentStatus: normalizeEmploymentStatus(payload.employmentStatus),
    designationId: designation.id,
    fullName,
    passwordHash,
    roleId: role.id
  });
};

const createUser = async (actor, payload) => {
  const role = await repository.findRoleById(payload.roleId);
  const roleKey = toRoleKey(role);

  if (![ROLE_KEYS.ADMIN, ROLE_KEYS.EMPLOYEE].includes(roleKey)) {
    throw new ApiError(400, "Only Admin and Employee users can be created here");
  }

  requireCreatePermission(actor, roleKey);

  if (roleKey === ROLE_KEYS.ADMIN) {
    return createAdmin(payload);
  }

  return createEmployee(payload);
};

module.exports = {
  createAdmin,
  createUser,
  listAdmins,
  listUsers,
  getUser,
  getAdmin,
  updateAdmin,
  updateUser,
  deleteAdmin,
  createEmployee
};
