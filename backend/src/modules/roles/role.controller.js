const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const service = require("./role.service");

const listRoles = asyncHandler(async (req, res) => {
  const roles = await service.listRoles();

  return sendSuccess(res, 200, "Roles fetched successfully", roles);
});

const getRole = asyncHandler(async (req, res) => {
  const role = await service.getRole(req.params.id);

  return sendSuccess(res, 200, "Role fetched successfully", role);
});

const getRoleDetails = asyncHandler(async (req, res) => {
  const role = await service.getRoleDetails(req.params.id);

  return sendSuccess(res, 200, "Role details fetched successfully", role);
});

const listPermissions = asyncHandler(async (req, res) => {
  const permissions = await service.listPermissions();

  return sendSuccess(res, 200, "Permissions fetched successfully", permissions);
});

const createRole = asyncHandler(async (req, res) => {
  const role = await service.createRole(req.body);

  return sendSuccess(res, 201, "Role created successfully", role);
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await service.updateRole(req.params.id, req.body);

  return sendSuccess(res, 200, "Role updated successfully", role);
});

const deleteRole = asyncHandler(async (req, res) => {
  await service.deleteRole(req.params.id);

  return sendSuccess(res, 200, "Role deleted successfully");
});

module.exports = {
  listRoles,
  getRole,
  getRoleDetails,
  listPermissions,
  createRole,
  updateRole,
  deleteRole
};
