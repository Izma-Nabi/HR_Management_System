require("../../global/env");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const permissions = [
  { permissionName: "create_admin" },
  { permissionName: "edit_admin" },
  { permissionName: "delete_admin" },

  { permissionName: "create_employee" },
  { permissionName: "edit_employee" },
  { permissionName: "delete_employee" },

  { permissionName: "view_reports" }
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