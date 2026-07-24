const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const service = require("./role.service");

const listRoles = asyncHandler(async (req, res) => {
  const roles = await service.listRoles();

  return sendSuccess(
    res,
    200,
    "Roles fetched successfully",
    roles
  );
});

module.exports = {
  listRoles
};