const { ApiError } = require("../../utils/apiResponse");
const departmentsRepository = require("./departments.repository");

const parseDepartmentId = (id) => {
  const departmentId = Number(id);

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    throw new ApiError(400, "Invalid department id");
  }

  return departmentId;
};

const listDepartments = async () => {
  return departmentsRepository.listDepartments();
};

const getDepartment = async (id) => {
  const departmentId = parseDepartmentId(id);
  const department = await departmentsRepository.findDepartmentById(departmentId);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  return department;
};

const createDepartment = async (payload) => {
  const existingDepartment = await departmentsRepository.findDepartmentByName(payload.departmentName);

  if (existingDepartment) {
    throw new ApiError(409, "Department name already exists");
  }

  return departmentsRepository.createDepartment(payload);
};

const updateDepartment = async (id, payload) => {
  const department = await getDepartment(id);

  if (payload.departmentName) {
    const existingDepartment = await departmentsRepository.findDepartmentByName(payload.departmentName);

    if (existingDepartment && existingDepartment.id !== department.id) {
      throw new ApiError(409, "Department name already exists");
    }
  }

  return departmentsRepository.updateDepartment(department.id, payload);
};

const deleteDepartment = async (id) => {
  const department = await getDepartment(id);
  const userCount = await departmentsRepository.countUsersByDepartment(
  department.id
    );

    if (userCount > 0) {
      throw new ApiError(
        409,
        "Cannot delete department because users are assigned to it"
      );
    }

  return departmentsRepository.deleteDepartment(department.id);
};

const listDepartmentDesignations = async (id) => {
  parseDepartmentId(id);

  return departmentsRepository.listDepartmentDesignations(id);
};


module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listDepartmentDesignations
};