const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, toRoleKey } = require("../../utils/roles");

const departmentInclude = {
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
};

const mapPerson = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  user: {
    id: user.id,
    email: user.email,
    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    status: user.employmentStatus
  }
});

const mapDepartment = (department) => {
  const admins = [];
  const employees = [];
  const people = Array.isArray(department.users)
    ? department.users
    : [];

  people.forEach((user) => {
    const role = toRoleKey(user.role);

    if (role === ROLE_KEYS.EMPLOYEE) {
      employees.push(mapPerson(user));
      return;
    }

    if (
      role === ROLE_KEYS.ADMIN ||
      role === ROLE_KEYS.SUPER_ADMIN
    ) {
      admins.push(mapPerson(user));
    }
  });

  const { users, ...departmentData } = department;

  return {
    ...departmentData,
    admins,
    employees,
    userCount: people.length
  };
};

const listDepartments = async () => {
  const departments = await prisma.department.findMany({
    include: departmentInclude,
    orderBy: {
      departmentName: "asc"
    }
  });

  return departments.map(mapDepartment);
};

const findDepartmentById = async (id, dbClient = prisma) => {
  const department = await dbClient.department.findUnique({
    where: {
      id: Number(id)
    },
    include: departmentInclude
  });

  if (!department) {
    return null;
  }

  return mapDepartment(department);
};

const findDepartmentByName = async (departmentName) => {
  return prisma.department.findUnique({
    where: {
      departmentName
    }
  });
};

const createDepartment = async (data) => {
  const department = await prisma.department.create({
    data: {
      departmentName: data.departmentName,
      description: data.description
    },
    include: departmentInclude
  });

  return mapDepartment(department);
};

const updateDepartment = async (id, data) => {
  const updatedDepartment = await prisma.department.update({
    where: {
      id: Number(id)
    },
    data: {
      departmentName: data.departmentName,
      description: data.description
    },
    include: departmentInclude
  });

  return mapDepartment(updatedDepartment);
};

const deleteDepartment = async (id) => {
  const departmentId = Number(id);

  if (!Number.isInteger(departmentId)) {
    throw new ApiError(400, "Invalid department ID");
  }

  const userCount = await prisma.user.count({
    where: {
      departmentId: departmentId,
    },
  });

  console.log(
    `Department ${departmentId} has ${userCount} assigned user(s)`
  );

  if (userCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete department because ${userCount} user(s) are assigned to it.`
    );
  }

  return prisma.department.delete({
    where: {
      id: departmentId,
    },
  });
};

const getDepartmentUsers = async (departmentId) => {
  return prisma.user.findMany({
    where: {
      departmentId: Number(departmentId)
    },
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
      },
      department: {
        select: {
          id: true,
          departmentName: true
        }
      },
      designation: {
        select: {
          id: true,
          designationName: true
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
  });
};


const countUsersByDepartment = async (departmentId) => {
  const count = await prisma.user.count({
    where: {
      departmentId: Number(departmentId),
    },
  });

  console.log(
    `Users assigned to department ${departmentId}:`,
    count
  );

  return count;
};

const getDepartments = async () => {
  const departments = await prisma.department.findMany({
    orderBy: {
      departmentName: "asc"
    }
  });

  return Promise.all(
    departments.map(async (department) => {
      const userCount = await prisma.user.count({
        where: {
          departmentId: department.id
        }
      });

      return {
        ...department,
        userCount
      };
    })
  );
};


const listDepartmentDesignations = async (departmentId) => {
  return prisma.designation.findMany({
    where: {
      departmentId: Number(departmentId)
    },
    select: {
      id: true,
      designationName: true,
      departmentId: true
    },
    orderBy: {
      designationName: "asc"
    }
  });
};

module.exports = {
  listDepartments,
  findDepartmentById,
  findDepartmentByName,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listDepartmentDesignations,
  countUsersByDepartment,
  getDepartments,
  getDepartmentUsers
};