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

module.exports = {
  listDesignations
};
