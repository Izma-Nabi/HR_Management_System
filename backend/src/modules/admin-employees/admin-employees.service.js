const { ApiError } = require("../../utils/apiResponse");
const { hashPassword } = require("../../utils/password");
const adminEmployeesRepository = require("./admin-employees.repository");

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
          designation: payload.designation
        }
      });
    } catch (error) {
      if (error.message === "Employee role is not configured") {
        throw new ApiError(500, "Employee role is not configured. Run role seeds before creating employee profiles.");
      }

      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "";
      const isGeneratedCodeCollision = error.code === "P2002"
        && (target.includes("employeeCode") || target.includes("employee_code"));

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
