const { ApiError } = require("../../utils/apiResponse");
const { hashPassword } = require("../../utils/password");
const adminEmployeesRepository = require("./admin-employees.repository");

const createEmployee = async (payload) => {
  const [
    existingUser,
    existingEmployeeCode,
    existingFingerprint
  ] = await Promise.all([
    adminEmployeesRepository.findUserByEmail(payload.email),
    adminEmployeesRepository.findEmployeeByCode(payload.employeeCode),
    adminEmployeesRepository.findEmployeeByFingerprintId(payload.fingerprintId)
  ]);

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  if (existingEmployeeCode) {
    throw new ApiError(409, "Employee code is already registered");
  }

  if (existingFingerprint) {
    throw new ApiError(409, "Fingerprint ID is already registered");
  }

  const passwordHash = await hashPassword(payload.password);

  try {
    return await adminEmployeesRepository.createEmployeeAccount({
      user: {
        fullName: payload.name,
        email: payload.email,
        passwordHash
      },
      employee: {
        employeeCode: payload.employeeCode,
        name: payload.name,
        phone: payload.phone,
        department: payload.department,
        designation: payload.designation,
        fingerprintId: payload.fingerprintId,
        employmentStatus: payload.employmentStatus
      }
    });
  } catch (error) {
    if (error.message === "Employee role is not configured") {
      throw new ApiError(500, "Employee role is not configured. Run role seeds before creating employees.");
    }

    throw error;
  }
};

module.exports = {
  createEmployee
};
