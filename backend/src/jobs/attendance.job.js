const cron = require("node-cron");

const attendanceService = require("../modules/attendance/attendance.service");

let syncRunning = false;

const syncAttendanceFromSheet = async () => {
  if (syncRunning) {
    console.log("Attendance sync skipped because a previous sync is still running.");
    return null;
  }

  syncRunning = true;

  try {
    const result = await attendanceService.importAttendance();

    console.log(
      `Attendance synced. Total sheet rows: ${result.totalRows}, inserted: ${result.insertedRows}, matched existing: ${result.matchedRows}, skipped: ${result.skippedRows}`
    );

    return result;
  } catch (error) {
    console.error("Attendance sync failed:", error.message);
    return null;
  } finally {
    syncRunning = false;
  }
};

const startAttendanceScheduler = () => {
  console.log("Attendance scheduler started. Syncing Google Sheet every 30 seconds.");

  cron.schedule("*/30 * * * * *", syncAttendanceFromSheet);
};

module.exports = {
  startAttendanceScheduler,
  syncAttendanceFromSheet
};
