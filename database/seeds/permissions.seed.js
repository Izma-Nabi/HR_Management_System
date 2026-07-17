require("../../global/env");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const permissions = [
  { permissionName: "MANAGE_ADMINS" },
  { permissionName: "MANAGE_DEPARTMENTS" },
  { permissionName: "MANAGE_EMPLOYEES" },
  { permissionName: "VIEW_SYSTEM_SUMMARY" },
  { permissionName: "VIEW_TEAM_ATTENDANCE" },
  { permissionName: "VIEW_OWN_ATTENDANCE" },
  { permissionName: "VIEW_REPORTS" }
];

const main = async () => {

  for (const permission of permissions) {

    await prisma.permission.upsert({

      where: {
        permissionName: permission.permissionName
      },

      update: {},

      create: {
        permissionName: permission.permissionName
      }

    });

  }

  console.log("Permissions seeded successfully.");

};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
