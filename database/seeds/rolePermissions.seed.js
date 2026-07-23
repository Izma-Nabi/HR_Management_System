require("../../global/env");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const normalizeRoleName = (roleName) => {
  return String(roleName || "").trim().toUpperCase().replace(/\s+/g, "_");
};

const normalizePermissionName = (permissionName) => {
  return String(permissionName || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
};

const rolePermissionGroups = [
  {
    roleNames: ["Super Admin", "SUPER_ADMIN", "SUPER ADMIN"],
    permissions: [
    "CREATE_ADMIN",
    "VIEW_ADMINS",
    "UPDATE_ADMIN",
    "DELETE_ADMIN",
    "CREATE_DEPARTMENT",
    "VIEW_DEPARTMENTS",
    "UPDATE_DEPARTMENT",
    "DELETE_DEPARTMENT",
    "CREATE_EMPLOYEE",
    "VIEW_EMPLOYEES",
    "UPDATE_EMPLOYEE",
    "DELETE_EMPLOYEE",
    "IMPORT_ATTENDANCE",
    "VIEW_SYSTEM_SUMMARY",
    "VIEW_TEAM_ATTENDANCE",
    "VIEW_OWN_ATTENDANCE",
    "VIEW_REPORTS",
    "VIEW_ALL_LEAVES",
    "VIEW_TEAM_LEAVES",
    "APPROVE_LEAVE",
    "REJECT_LEAVE"
    ]
  },
  {
    roleNames: ["Admin", "ADMIN"],
    permissions: [
    "CREATE_LEAVE",
    "CREATE_EMPLOYEE",
    "VIEW_EMPLOYEES",
    "UPDATE_EMPLOYEE",
    "DELETE_EMPLOYEE",
    "IMPORT_ATTENDANCE",
    "VIEW_SYSTEM_SUMMARY",
    "VIEW_REPORTS",
    "VIEW_OWN_LEAVES",
    "VIEW_ALL_LEAVES",
    "VIEW_TEAM_LEAVES",
    "APPROVE_LEAVE",
    "REJECT_LEAVE",
    "CANCEL_LEAVE"
    ]
  },
  {
    roleNames: ["Employee", "EMPLOYEE"],
    permissions: [
    "CREATE_LEAVE",
    "VIEW_OWN_ATTENDANCE",
    "VIEW_OWN_LEAVES",
    "CANCEL_LEAVE"
    ]
  }
];

const main = async () => {
  const expectedRoleNames = rolePermissionGroups
    .flatMap((group) => group.roleNames);
  const expectedPermissions = rolePermissionGroups
    .flatMap((group) => group.permissions);

  const roles = await prisma.role.findMany({
    where: {
      roleName: {
        in: expectedRoleNames
      }
    }
  });

  const permissions = await prisma.permission.findMany({
    where: {
      permissionName: {
        in: expectedPermissions
      }
    }
  });

  const roleMap = new Map(
    roles.map((role) => [normalizeRoleName(role.roleName), role.id])
  );
  const permissionMap = new Map(
    permissions.map((permission) => [normalizePermissionName(permission.permissionName), permission.id])
  );

  for (const { roleNames, permissions: permissionNames } of rolePermissionGroups) {
    const roleId = roleNames
      .map(normalizeRoleName)
      .map((roleName) => roleMap.get(roleName))
      .find(Boolean);

    if (!roleId) {
      throw new Error(`Run roles.seed.js first. Missing role: ${roleNames[0]}`);
    }

    for (const permissionName of permissionNames) {
      const permissionId = permissionMap.get(normalizePermissionName(permissionName));

      if (!permissionId) {
        throw new Error(`Run permissions.seed.js first. Missing permission: ${permissionName}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId
          }
        },
        update: {},
        create: {
          roleId,
          permissionId
        }
      });
    }
  }

  console.log("Role permissions seeded successfully.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
