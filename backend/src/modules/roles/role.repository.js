const { prisma } = require("../../../../database/prisma");
const { ROLE_KEYS, roleNameCandidates } = require("../../utils/roles");

const listCreatableRoles = async () => {
  return prisma.role.findMany({
    where: {
      OR: [
        {
          roleName: {
            in: roleNameCandidates(ROLE_KEYS.ADMIN)
          }
        },
        {
          roleName: {
            in: roleNameCandidates(ROLE_KEYS.EMPLOYEE)
          }
        }
      ]
    },
    select: {
      id: true,
      roleName: true
    },
    orderBy: {
      roleName: "asc"
    }
  });
};

module.exports = {
  listCreatableRoles
};
