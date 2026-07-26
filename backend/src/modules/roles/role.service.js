const repository = require("./role.repository");

const listRoles = async () => {
  return repository.listRoles();
};

const getRole = async (id) => {
  return repository.getRoleById(id);
};

const getRoleDetails = async (id) => {
  return repository.getRoleDetails(id);
};

const listPermissions = async () => {
  return repository.listPermissions();
};

const createRole = async ({ roleName, permissions }) => {
  const role = await repository.createRole(roleName);

  await repository.createRolePermissions(
    role.id,
    permissions
  );

  return repository.getRoleById(role.id);
};

const updateRole = async (id, { roleName, permissions }) => {
  await repository.updateRole(id, roleName);

  await repository.deleteRolePermissions(id);

  await repository.createRolePermissions(
    id,
    permissions
  );

  return repository.getRoleById(id);
};

const deleteRole = async (id) => {
  return repository.deleteRole(id);
};

module.exports = {
  listRoles,
  getRole,
  getRoleDetails,
  listPermissions,
  createRole,
  updateRole,
  deleteRole,
};