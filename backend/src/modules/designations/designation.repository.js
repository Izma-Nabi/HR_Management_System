const { prisma } = require("../../../../database/prisma");

const designationSelect = {
  id: true,
  designationName: true,
  departmentId: true,
  department: {
    select: {
      id: true,
      departmentName: true
    }
  },
  users: {
    select: {
      id: true,
      userCode: true,
      firstName: true,
      lastName: true,
      email: true,
      employmentStatus: true
    },
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ]
  },
  _count: {
    select: {
      users: true
    }
  }
};

const listDesignations = async () => {
  return prisma.designation.findMany({
    select: designationSelect,
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
    select: designationSelect
  });
};

const updateDesignation = async (id, { designationName }) => {
  return prisma.designation.update({
    where: {
      id: Number(id)
    },
    data: {
      designationName
    },
    select: designationSelect
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
  updateDesignation,
  deleteDesignation
};
