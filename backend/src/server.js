const app = require("./app");
const env = require("../../global/env");
const { importAttendanceFile } = require("./jobs/attendance.job");
const {
  testPrismaConnection,
  disconnectPrisma
} = require("../../database/prisma");

const { startAttendanceScheduler } = require("./jobs/attendance.job");

let server;

const startServer = async () => {
    try {
      await testPrismaConnection();

      server = app.listen(env.port, async () => {
        console.log(`Server running on port ${env.port}`);

        await importAttendanceFile();
      });

    } catch (error) {
      console.error("Failed to start server:", error.message);
      process.exit(1);
    }
  };
// If a promise rejection is not handled anywhere, shut down cleanly.
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Graceful shutdown for Ctrl+C or deployment stop signals.
const shutdown = async () => {
  await disconnectPrisma();

  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer();
