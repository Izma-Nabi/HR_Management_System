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
  const department = await repository.findDepartmentById(id);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  const userCount = await repository.countUsersByDepartment(id);

  if (userCount > 1) {
    throw new ApiError(
      400,
      "Department cannot be deleted because multiple users are assigned to it"
    );
  }

  return repository.deleteDepartment(id);
};

const getDepartmentUsers = async (departmentId) => {
  const department = await prisma.department.findUnique({
    where: {
      id: Number(departmentId)
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          employmentStatus: true,
          role: {
            select: {
              id: true,
              roleName: true
            }
          }
        },
        orderBy: [
          {
            firstName: "asc"
          },
          {
            lastName: "asc"
          }
        ]
      }
    }
  });

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  return {
    id: department.id,
    departmentName: department.departmentName,
    description: department.description,
    users: department.users,
    userCount: department.users.length
  };
};

const listDepartmentDesignations = async (id) => {
  const departmentId = parseDepartmentId(id);
  const department = await departmentsRepository.findDepartmentById(departmentId);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  return departmentsRepository.listDepartmentDesignations(departmentId);
};

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listDepartmentDesignations,
  getDepartmentUsers
};
