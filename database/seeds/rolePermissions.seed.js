require("../../global/env");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const permissionsByRole = {
  "SUPER ADMIN": [
    "MANAGE_ADMINS",
    "MANAGE_DEPARTMENTS",
    "MANAGE_EMPLOYEES",
    "VIEW_SYSTEM_SUMMARY",
    "VIEW_TEAM_ATTENDANCE",
    "VIEW_OWN_ATTENDANCE",
    "VIEW_REPORTS"
  ],
  ADMIN: [
    "MANAGE_EMPLOYEES",
    "VIEW_SYSTEM_SUMMARY",
    "VIEW_REPORTS"
  ],
  "PROJECT MANAGER": [
    "VIEW_TEAM_ATTENDANCE"
  ],
  EMPLOYEE: [
    "VIEW_OWN_ATTENDANCE"
  ]
};

const main = async () => {
  const roles = await prisma.role.findMany({
    where: {
      roleName: {
        in: Object.keys(permissionsByRole)
      }
    }
  });

  const permissions = await prisma.permission.findMany({
    where: {
      permissionName: {
        in: Object.values(permissionsByRole).flat()
      }
    }
  });

  const roleMap = Object.fromEntries(
    roles.map((role) => [role.roleName, role.id])
  );
  const permissionMap = Object.fromEntries(
    permissions.map((permission) => [permission.permissionName, permission.id])
  );

  for (const [roleName, permissionNames] of Object.entries(permissionsByRole)) {
    const roleId = roleMap[roleName];

    if (!roleId) {
      throw new Error(`Run roles.seed.js first. Missing role: ${roleName}`);
    }

    for (const permissionName of permissionNames) {
      const permissionId = permissionMap[permissionName];

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
