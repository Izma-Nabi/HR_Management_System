const { prisma } = require("../../../../database/prisma");


const listDepartments = async () => {
  return prisma.department.findMany({
    orderBy: {
      departmentName: "asc"
    }
  });
};


const findDepartmentById = async (id, dbClient = prisma) => {
  return dbClient.department.findUnique({
    where: {
      id: Number(id)
    }
  });
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
    }
  });
};

const updateDepartment = async (id, data) => {
  return prisma.department.update({
    where: {
      id: Number(id)
    },
    data: {
      departmentName: data.departmentName,
      description: data.description
    }
  });
};

const deleteDepartment = async (id) => {
  return prisma.department.delete({
    where: {
      id: Number(id)
    }
  });
};

const countUsersByDepartment = async (departmentId) => {
  return prisma.user.count({
    where: {
      departmentId: Number(departmentId)
    }
  });
};


const listDepartmentDesignations = async (departmentId) => {
  return prisma.designation.findMany({
    where: {
      departmentId: Number(departmentId)
    },
    select: {
      id: true,
      designationName: true
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
  countUsersByDepartment,
  listDepartmentDesignations
};
