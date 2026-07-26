const { prisma } = require("../../../../database/prisma");

const listRoles = async () => {
  return prisma.role.findMany({
    orderBy: {
      roleName: "asc",
    },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  });
};

const getRoleById = async (id) => {
  return prisma.role.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });
};

const getRoleDetails = async (id) => {
  return prisma.role.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
      users: {
        include: {
          department: true,
        },
        orderBy: {
          firstName: "asc",
        },
      },
    },
  });
};


const listPermissions = async () => {
  return prisma.permission.findMany({
    orderBy: {
      permissionName: "asc",
    },
  });
};

const createRole = async (roleName) => {
  return prisma.role.create({
    data: {
      roleName,
    },
  });
};


const createRolePermissions = async (roleId, permissionIds) => {
  if (!permissionIds?.length) return;

  return prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({
      roleId: Number(roleId),
      permissionId: Number(permissionId),
    })),
  });
};

const updateRole = async (id, roleName) => {
  return prisma.role.update({
    where: {
      id: Number(id),
    },
    data: {
      roleName,
    },
  });
};

const deleteRole = async (id) => {
  return prisma.role.delete({
    where: {
      id: Number(id),
    },
  });
};

const deleteRolePermissions = async (roleId) => {
  return prisma.rolePermission.deleteMany({
    where: {
      roleId: Number(roleId),
    },
  });
};


module.exports = {
  listRoles,
  getRoleById,
  listPermissions,
  createRole,
  updateRole,
  deleteRole,
  deleteRolePermissions,
  createRolePermissions,
  getRoleDetails
};