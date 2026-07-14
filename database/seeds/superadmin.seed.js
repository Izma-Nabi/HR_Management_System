require("../../global/env");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const ADMIN_CODE_PREFIX = "ADM";
const ADMIN_CODE_WIDTH = 3;

const formatAdminCode = (number) => {
  return `${ADMIN_CODE_PREFIX}${String(number).padStart(ADMIN_CODE_WIDTH, "0")}`;
};

const generateNextAdminCode = async () => {
  const prefixOffset = ADMIN_CODE_PREFIX.length + 1;
  const codePattern = `^${ADMIN_CODE_PREFIX}[0-9]+$`;

  const rows = await prisma.$queryRaw`
    SELECT COALESCE(MAX(CAST(SUBSTRING(userCode, ${prefixOffset}) AS UNSIGNED)), 0) AS maxNumber
    FROM users
    WHERE userCode REGEXP ${codePattern}
  `;

  const maxNumber = Number(rows[0]?.maxNumber || 0);

  return formatAdminCode(maxNumber + 1);
};

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

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      userCode: true
    }
  });

  const userCode = existingUser?.userCode || await generateNextAdminCode();

  await prisma.user.upsert({
    where: {
      email
    },

    update: {
      userCode,
      firstName: "Super",
      lastName: "Admin",
      passwordHash,
      roleId: superAdminRole.id,
      status: "ACTIVE"
    },

    create: {
      userCode,
      firstName: "Super",
      lastName: "Admin",
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
