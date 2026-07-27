const { prisma } = require("../../../../database/prisma");

const listDesignations = async () => {
  return prisma.designation.findMany({
    select: {
      id: true,
      designationName: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          departmentName: true
        }
      },
      _count: {
        select: {
          users: true
        }
      }
    },
    orderBy: [
      {
        department: {
          departmentName: "asc"
        }
      },
      {
        designationName: "asc"
      }
    ]
  });
};

const findDepartmentById = async (id) => {
  return prisma.department.findUnique({
    where: {
      id: Number(id)
    },
    select: {
      id: true,
      departmentName: true
    }
  });
};

const findDesignationById = async (id) => {
  return prisma.designation.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      department: {
        select: {
          id: true,
          departmentName: true
        }
      },
      _count: {
        select: {
          users: true
        }
      }
    }
  });
};

const findDesignationByNameAndDepartment = async (designationName, departmentId) => {
  return prisma.designation.findFirst({
    where: {
      departmentId: Number(departmentId),
      designationName: String(designationName || "").trim()
    }
  });
};

const createDesignation = async ({ departmentId, designationName }) => {
  return prisma.designation.create({
    data: {
      departmentId: Number(departmentId),
      designationName
    },
    select: {
      id: true,
      designationName: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          departmentName: true
        }
      }
    }
  });
};

const deleteDesignation = async (id) => {
  return prisma.designation.delete({
    where: {
      id: Number(id)
    }
  });
};

module.exports = {
  listDesignations,
  findDepartmentById,
  findDesignationById,
  findDesignationByNameAndDepartment,
  createDesignation,
  deleteDesignation
};
