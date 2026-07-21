const app = require("./app");
const env = require("../../global/env");
const {
  startAttendanceScheduler,
  syncAttendanceFromSheet
} = require("./jobs/attendance.job");
const {
  testPrismaConnection,
  disconnectPrisma
} = require("../../database/prisma");

let server;

const exitAfterStartupFailure = (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${env.port} is already in use. Stop the existing backend process or set PORT to another value.`
    );
  } else {
    console.error("Server failed while listening:", error);
  }

  disconnectPrisma()
    .catch((disconnectError) => {
      console.error("Failed to disconnect Prisma:", disconnectError);
    })
    .finally(() => process.exit(1));
};

const startServer = async () => {
  try {
    await testPrismaConnection();

    server = app.listen(env.port);

    server.on("listening", async () => {
      console.log(`Server running on port ${env.port}`);

      await syncAttendanceFromSheet();
      startAttendanceScheduler();
    });

    server.on("error", exitAfterStartupFailure);

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
