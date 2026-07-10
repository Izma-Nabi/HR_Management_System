require("../../global/env");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const main = async () => {

  // Find roles
  const superAdmin = await prisma.role.findUnique({
    where: {
      roleName: "SUPER ADMIN"
    }
  });

  const admin = await prisma.role.findUnique({
    where: {
      roleName: "ADMIN"
    }
  });

  if (!superAdmin || !admin) {
    throw new Error("Run roles.seed.js first.");
  }

  // Find permissions
  const permissions = await prisma.permission.findMany();

  const permissionMap = {};

  permissions.forEach((permission) => {
    permissionMap[permission.permissionName] = permission.id;
  });

  const rolePermissions = [

    // SUPER ADMIN
    {
      roleId: superAdmin.id,
      permissionId: permissionMap.create_admin
    },
    {
      roleId: superAdmin.id,
      permissionId: permissionMap.edit_admin
    },
    {
      roleId: superAdmin.id,
      permissionId: permissionMap.delete_admin
    },
    {
      roleId: superAdmin.id,
      permissionId: permissionMap.create_employee
    },
    {
      roleId: superAdmin.id,
      permissionId: permissionMap.edit_employee
    },
    {
      roleId: superAdmin.id,
      permissionId: permissionMap.delete_employee
    },
    {
      roleId: superAdmin.id,
      permissionId: permissionMap.view_reports
    },

    // ADMIN
    {
      roleId: admin.id,
      permissionId: permissionMap.create_employee
    },
    {
      roleId: admin.id,
      permissionId: permissionMap.edit_employee
    },
    {
      roleId: admin.id,
      permissionId: permissionMap.view_reports
    }

  ];

  for (const rp of rolePermissions) {

    await prisma.rolePermission.upsert({

      where: {
        roleId_permissionId: {
          roleId: rp.roleId,
          permissionId: rp.permissionId
        }
      },

      update: {},

      create: {
        roleId: rp.roleId,
        permissionId: rp.permissionId
      }

    });

  }

  console.log("✅ Role Permissions seeded successfully.");

};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });