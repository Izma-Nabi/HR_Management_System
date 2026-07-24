const { prisma } = require("../../../../database/prisma");

const listRoles = async () => {
  return prisma.role.findMany({
    orderBy: {
      roleName: "asc"
    }
  });
};

module.exports = {
  listRoles
};