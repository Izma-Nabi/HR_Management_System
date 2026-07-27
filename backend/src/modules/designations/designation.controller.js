const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const service = require("./designation.service");

const listDesignations = asyncHandler(async (req, res) => {
  const designations = await service.listDesignations();

  return sendSuccess(
    res,
    200,
    "Designations fetched successfully",
    designations
  );
});

const createDesignation = asyncHandler(async (req, res) => {
  const designation = await service.createDesignation(req.body);

  return sendSuccess(
    res,
    201,
    "Designation created successfully",
    designation
  );
});

const updateDesignation = asyncHandler(async (req, res) => {
  const designation = await service.updateDesignation(req.params.id, req.body);

  return sendSuccess(
    res,
    200,
    "Designation updated successfully",
    designation
  );
});

const deleteDesignation = asyncHandler(async (req, res) => {
  const designation = await service.deleteDesignation(req.params.id);

  return sendSuccess(
    res,
    200,
    "Designation deleted successfully",
    designation
  );
});

module.exports = {
  listDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation
};
