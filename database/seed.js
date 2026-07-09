require("../global/env");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const main = async () => {
  // Admin seed. Keep real seed credentials in global/.env, not in Git.
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD in global/.env before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: {
      email
    },
    update: {
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    },
    create: {
      fullName: "Super Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    }
  });

  console.log("Super Admin seed is ready.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
