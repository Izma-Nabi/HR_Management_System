const { prisma } = require("../../../../database/prisma");

const roleInclude = {
  rolePermissions: {
    include: {
      permission: true
    }
  },
  _count: {
    select: {
      users: true
    }
  }
};

const listRoles = async () => {
  return prisma.role.findMany({
    orderBy: {
      roleName: "asc"
    },
    include: roleInclude
  });
};

const getRoleById = async (id) => {
  return prisma.role.findUnique({
    where: {
      id: Number(id)
    },
    include: roleInclude
  });
};

const mapRoleDetails = (role) => {
  if (!role) {
    return null;
  }

  return {
    ...role,
    users: role.users.map((user) => ({
      ...user,
      designation: user.designation?.designationName || null
    }))
  };
};

const getRoleDetails = async (id) => {
  const role = await prisma.role.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      rolePermissions: {
        include: {
          permission: true
        }
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
      }
    }
  });

  return mapRoleDetails(role);
};

const listPermissions = async () => {
  return prisma.permission.findMany({
    orderBy: {
      permissionName: "asc"
    }
  });
};

const findPermissionsByIds = async (permissionIds) => {
  return prisma.permission.findMany({
    where: {
      id: {
        in: permissionIds.map(Number)
      }
    },
    select: {
      id: true
    }
  });
};

const findRoleByName = async (roleName) => {
  return prisma.role.findFirst({
    where: {
      roleName: String(roleName || "").trim()
    }
  });
};

const createRole = async ({ roleName, permissionIds }) => {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        roleName
      },
      select: {
        id: true
      }
    });

    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId: Number(permissionId)
        })),
        skipDuplicates: true
      });
    }

    return tx.role.findUnique({
      where: {
        id: role.id
      },
      include: roleInclude
    });
  });
};

const updateRole = async (id, { roleName, permissionIds }) => {
  return prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: {
        id: Number(id)
      },
      data: {
        roleName
      }
    });

    await tx.rolePermission.deleteMany({
      where: {
        roleId: Number(id)
      }
    });

    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: Number(id),
          permissionId: Number(permissionId)
        })),
        skipDuplicates: true
      });
    }

    return tx.role.findUnique({
      where: {
        id: Number(id)
      },
      include: roleInclude
    });
  });
};

const deleteRole = async (id) => {
  return prisma.role.delete({
    where: {
      id: Number(id)
    }
  });
};

module.exports = {
  listRoles,
  listCreatableRoles: listRoles,
  getRoleById,
  getRoleDetails,
  listPermissions,
  findPermissionsByIds,
  findRoleByName,
  createRole,
  updateRole,
  deleteRole
};
