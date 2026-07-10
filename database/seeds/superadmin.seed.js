require("../../global/env");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const main = async () => {

  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD in global/.env"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Find the SUPER_ADMIN role
  const superAdminRole = await prisma.role.findUnique({
    where: {
      roleName: "SUPER ADMIN"
    }
  });

  if (!superAdminRole) {
    throw new Error("Run roles.seed.js first.");
  }

  await prisma.user.upsert({
    where: {
      email
    },

    update: {
      roleId: superAdminRole.id,
      status: "ACTIVE"
    },

    create: {
      fullName: "Super Admin",
      email,
      passwordHash,
      roleId: superAdminRole.id,
      status: "ACTIVE"
    }
  });

  console.log("✅ Super Admin seed is ready.");

};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });