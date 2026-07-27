const { ApiError } = require("../../utils/apiResponse");
const repository = require("./role.repository");

const parseId = (id, label = "id") => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return parsedId;
};

const normalizeRoleName = (roleName) => {
  return String(roleName || "").trim().replace(/\s+/g, " ");
};

const normalizePermissionIds = (permissions) => {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return Array.from(
    new Set(
      permissions
        .map(Number)
        .filter((permissionId) => Number.isInteger(permissionId) && permissionId > 0)
    )
  );
};

const ensureRoleExists = async (id) => {
  const roleId = parseId(id, "role id");
  const role = await repository.getRoleById(roleId);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role;
};

const ensureUniqueRoleName = async (roleName, currentRoleId = null) => {
  const existingRole = await repository.findRoleByName(roleName);

  if (existingRole && Number(existingRole.id) !== Number(currentRoleId)) {
    throw new ApiError(409, "Role name already exists");
  }
};

const ensurePermissionsExist = async (permissionIds) => {
  if (!permissionIds.length) {
    throw new ApiError(400, "Select at least one permission");
  }

  const permissions = await repository.findPermissionsByIds(permissionIds);

  if (permissions.length !== permissionIds.length) {
    throw new ApiError(400, "One or more permissions are invalid");
  }
};

const payloadFromRequest = async (payload, currentRoleId = null) => {
  const roleName = normalizeRoleName(payload?.roleName);

  if (!roleName) {
    throw new ApiError(400, "Role name is required");
  }

  const permissionIds = normalizePermissionIds(payload?.permissions);

  await ensureUniqueRoleName(roleName, currentRoleId);
  await ensurePermissionsExist(permissionIds);

  return {
    roleName,
    permissionIds
  };
};

const listRoles = async () => {
  return repository.listRoles();
};

const getRole = async (id) => {
  return ensureRoleExists(id);
};

const getRoleDetails = async (id) => {
  const roleId = parseId(id, "role id");
  const role = await repository.getRoleDetails(roleId);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role;
};

const listPermissions = async () => {
  return repository.listPermissions();
};

const createRole = async (payload) => {
  const data = await payloadFromRequest(payload);

  return repository.createRole(data);
};

const updateRole = async (id, payload) => {
  const role = await ensureRoleExists(id);
  const data = await payloadFromRequest(payload, role.id);

  return repository.updateRole(role.id, data);
};

const deleteRole = async (id) => {
  const role = await ensureRoleExists(id);

  if (role._count?.users) {
    throw new ApiError(409, "Cannot delete a role assigned to users");
  }

  return repository.deleteRole(role.id);
};

module.exports = {
  listRoles,
  listCreatableRoles: listRoles,
  getRole,
  getRoleDetails,
  listPermissions,
  createRole,
  updateRole,
  deleteRole
};
