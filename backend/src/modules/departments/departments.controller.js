const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const departmentsService = require("./departments.service");

const listDepartments = asyncHandler(async (req, res) => {
  const result = await departmentsService.listDepartments();

  return sendSuccess(res, 200, "Departments fetched successfully", result);
});

const getDepartment = asyncHandler(async (req, res) => {
  const result = await departmentsService.getDepartment(req.params.id);

  return sendSuccess(res, 200, "Department fetched successfully", result);
});

const createDepartment = asyncHandler(async (req, res) => {
  const result = await departmentsService.createDepartment(req.body);

  return sendSuccess(res, 201, "Department created successfully", result);
});

const updateDepartment = asyncHandler(async (req, res) => {
  const result = await departmentsService.updateDepartment(req.params.id, req.body);

  return sendSuccess(res, 200, "Department updated successfully", result);
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const result = await departmentsService.deleteDepartment(req.params.id);

  return sendSuccess(res, 200, "Department deleted successfully", result);
});

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
