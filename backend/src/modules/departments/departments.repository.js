const { prisma } = require("../../../../database/prisma");

const adminSelect = {
  id: true,
  firstName: true,
  lastName: true,
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true
    }
  }
};

const employeeSelect = {
  id: true,
  departmentId: true,
  firstName: true,
  lastName: true,
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true
    }
  }
};

const attachEmployees = async (departments) => {
  const departmentList = Array.isArray(departments) ? departments : [departments];

  if (departmentList.length === 0) {
    return Array.isArray(departments) ? [] : null;
  }

  const departmentIds = departmentList.map((department) => department.id);

  const employees = await prisma.employeeProfile.findMany({
    where: {
      departmentId: {
        in: departmentIds
      }
    },
    select: employeeSelect,
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ]
  });

  const employeesByDepartment = employees.reduce((grouped, employee) => {
    const key = employee.departmentId || "";
    const { departmentId, ...employeeData } = employee;

    grouped[key] = grouped[key] || [];
    grouped[key].push(employeeData);

    return grouped;
  }, {});

  const mappedDepartments = departmentList.map((department) => {
    return {
      ...department,
      employees: employeesByDepartment[department.id] || []
    };
  });

  return Array.isArray(departments) ? mappedDepartments : mappedDepartments[0];
};

const departmentInclude = {
  admins: {
    select: adminSelect,
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

const listDepartments = async () => {
  const departments = await prisma.department.findMany({
    include: departmentInclude,
    orderBy: {
      departmentName: "asc"
    }
  });

  return attachEmployees(departments);
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

  return attachEmployees(department);
};

const findDepartmentByName = async (departmentName) => {
  return prisma.department.findUnique({
    where: {
      departmentName
    }
  });
};

const createDepartment = async (data) => {
  return prisma.department.create({
    data: {
      departmentName: data.departmentName,
      description: data.description
    },
    include: departmentInclude
  });
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

  return attachEmployees(updatedDepartment);
};

const deleteDepartment = async (id) => {
  return prisma.department.delete({
    where: {
      id: Number(id)
    }
  });
};

module.exports = {
  listDepartments,
  findDepartmentById,
  findDepartmentByName,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
