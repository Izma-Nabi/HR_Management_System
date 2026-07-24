require("../../global/env");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const permissions = [
  { permissionName: "CREATE_ADMIN" },
  { permissionName: "VIEW_ADMINS" },
  { permissionName: "UPDATE_ADMIN" },
  { permissionName: "DELETE_ADMIN" },
  { permissionName: "CREATE_DEPARTMENT" },
  { permissionName: "VIEW_DEPARTMENTS" },
  { permissionName: "UPDATE_DEPARTMENT" },
  { permissionName: "DELETE_DEPARTMENT" },
  { permissionName: "CREATE_EMPLOYEE" },
  { permissionName: "VIEW_EMPLOYEES" },
  { permissionName: "UPDATE_EMPLOYEE" },
  { permissionName: "DELETE_EMPLOYEE" },
  { permissionName: "UPDATE_USER" },
  { permissionName: "IMPORT_ATTENDANCE" },
  { permissionName: "VIEW_SYSTEM_SUMMARY" },
  { permissionName: "VIEW_TEAM_ATTENDANCE" },
  { permissionName: "VIEW_OWN_ATTENDANCE" },
  { permissionName: "VIEW_REPORTS" },
  { permissionName: "CREATE_LEAVE" },
  { permissionName: "VIEW_OWN_LEAVES" },
  { permissionName: "VIEW_TEAM_LEAVES" },
  { permissionName: "VIEW_ALL_LEAVES" },
  { permissionName: "APPROVE_LEAVE" },
  { permissionName: "REJECT_LEAVE" },
  { permissionName: "CANCEL_LEAVE" }
];

const main = async () => {

  for (const permission of permissions) {

    await prisma.permission.upsert({

      where: {
        permissionName: permission.permissionName
      },

      update: {
        permissionName: permission.permissionName
      },

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
