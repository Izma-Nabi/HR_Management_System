const { ApiError } = require("../../utils/apiResponse");
const { hashPassword } = require("../../utils/password");
const adminEmployeesRepository = require("./admin-employees.repository");

const findDesignationFromPayload = async (payload) => {
  if (payload.designationId) {
    return adminEmployeesRepository.findDesignationById(payload.designationId);
  }

  if (!payload.designation) {
    return null;
  }

  const numericDesignation = Number(payload.designation);

  if (Number.isInteger(numericDesignation) && numericDesignation > 0) {
    return adminEmployeesRepository.findDesignationById(numericDesignation);
  }

  return adminEmployeesRepository.findDesignationByNameAndDepartment(
    payload.designation,
    payload.departmentId
  );
};

const ensureDepartmentDesignation = async (payload) => {
  const designation = await findDesignationFromPayload(payload);

  if (!designation) {
    throw new ApiError(400, "Designation is required");
  }

  if (Number(designation.departmentId) !== Number(payload.departmentId)) {
    throw new ApiError(400, "Designation does not belong to the selected department");
  }

  return designation;
};

const listEmployees = async () => {
  return adminEmployeesRepository.listEmployeeAccounts();
};

const createEmployee = async (payload) => {
  const existingUser = await adminEmployeesRepository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const department = await adminEmployeesRepository.findDepartmentById(payload.departmentId);

  if (!department) {
    throw new ApiError(400, "Department not found");
  }

  const passwordHash = await hashPassword(payload.password);
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();
  const designation = await ensureDepartmentDesignation(payload);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await adminEmployeesRepository.createEmployeeAccount({
        user: {
          fullName,
          email: payload.email,
          passwordHash
        },
        employee: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          address: payload.address,
          photo: payload.photo,
          departmentId: payload.departmentId,
          designationId: designation.id
        }
      });
    } catch (error) {
      if (error.message === "Employee role is not configured") {
        throw new ApiError(500, "Employee role is not configured. Run role seeds before creating employee profiles.");
      }

      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "";
      const isGeneratedCodeCollision = error.code === "P2002"
        && (target.includes("employeeCode") || target.includes("employee_code") || target.includes("userCode"));

      if (isGeneratedCodeCollision && attempt < 3) {
        continue;
      }

      throw error;
    }
  }
};

module.exports = {
  listEmployees,
  createEmployee
};
