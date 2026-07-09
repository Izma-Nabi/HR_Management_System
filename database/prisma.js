const env = require("../global/env");
const { PrismaClient } = require("@prisma/client");

// Global database client used by both admin and employee modules.
// Keeping it in Bookme.pk/database makes database access easy to find.
const prisma = global.prisma || new PrismaClient({
  log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"]
});

if (env.nodeEnv !== "production") {
  global.prisma = prisma;
}

const testPrismaConnection = async () => {
  await prisma.$queryRaw`SELECT 1`;
};

const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

module.exports = {
  prisma,
  testPrismaConnection,
  disconnectPrisma
};
