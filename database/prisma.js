const env = require("../global/env");
const { PrismaClient } = require("@prisma/client");

const TRANSIENT_DATABASE_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024"
]);

const RETRYABLE_READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy"
]);

const isTransientDatabaseError = (error) => {
  return TRANSIENT_DATABASE_CODES.has(error?.code);
};

const wait = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const withDatabaseRetry = async (
  operation,
  { retryDelays = [300, 900] } = {}
) => {
  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const canRetry =
        isTransientDatabaseError(error) && attempt < retryDelays.length;

      if (!canRetry) {
        throw error;
      }

      await wait(retryDelays[attempt]);
    }
  }

  throw new Error("Database retry loop exited unexpectedly");
};

const createPrismaClient = () => {
  const client = new PrismaClient({
    // Retried transient errors are intentionally quiet. Exhausted errors are
    // logged once by the API error middleware.
    log: env.nodeEnv === "development" ? ["warn"] : ["error"]
  });

  return client.$extends({
    query: {
      $allModels: {
        $allOperations({ operation, args, query }) {
          if (!RETRYABLE_READ_OPERATIONS.has(operation)) {
            return query(args);
          }

          return withDatabaseRetry(() => query(args));
        }
      }
    }
  });
};

// Global database client used by both admin and employee modules.
// Keeping it in Bookme.pk/database makes database access easy to find.
const prisma = global.prisma || createPrismaClient();

if (env.nodeEnv !== "production") {
  global.prisma = prisma;
}

const testPrismaConnection = async () => {
  await withDatabaseRetry(() => prisma.$queryRaw`SELECT 1`);
};

const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

module.exports = {
  prisma,
  testPrismaConnection,
  disconnectPrisma,
  isTransientDatabaseError,
  withDatabaseRetry
};
