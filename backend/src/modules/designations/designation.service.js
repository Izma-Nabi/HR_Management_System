const { ApiError } = require("../../utils/apiResponse");
const repository = require("./designation.repository");

const listDesignations = async () => {
  return repository.listDesignations();
};

const parseId = (id, label = "id") => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return parsedId;
};

const normalizeDesignationName = (designationName) => {
  return String(designationName || "").trim().replace(/\s+/g, " ");
};

const createDesignation = async (payload) => {
  const departmentId = parseId(payload.departmentId, "department id");
  const designationName = normalizeDesignationName(payload.designationName);
  const department = await repository.findDepartmentById(departmentId);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  const existingDesignation = await repository.findDesignationByNameAndDepartment(
    designationName,
    departmentId
  );

  if (existingDesignation) {
    throw new ApiError(409, "Designation already exists in this department");
  }

  return repository.createDesignation({
    departmentId,
    designationName
  });
};

const updateDesignation = async (id, payload) => {
  const designationId = parseId(id, "designation id");
  const designationName = normalizeDesignationName(payload.designationName);
  const designation = await repository.findDesignationById(designationId);

  if (!designation) {
    throw new ApiError(404, "Designation not found");
  }

  const existingDesignation = await repository.findDesignationByNameAndDepartment(
    designationName,
    designation.departmentId
  );

  if (existingDesignation && Number(existingDesignation.id) !== designationId) {
    throw new ApiError(409, "Designation already exists in this department");
  }

  return repository.updateDesignation(designationId, {
    designationName
  });
};

const deleteDesignation = async (id) => {
  const designationId = parseId(id, "designation id");
  const designation = await repository.findDesignationById(designationId);

  if (!designation) {
    throw new ApiError(404, "Designation not found");
  }

  if (designation._count?.users) {
    throw new ApiError(409, "Cannot delete a designation assigned to users");
  }

  return repository.deleteDesignation(designation.id);
};

module.exports = {
  listDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation
};
