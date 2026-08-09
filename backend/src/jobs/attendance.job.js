const cron = require("node-cron");

const attendanceService = require("../modules/attendance/attendance.service");
const attendanceCalculator = require("../modules/attendance/attendance.calculator");

const PAKISTAN_TIME_ZONE = "Asia/Karachi";

let syncRunning = false;
let summaryRunning = false;

const syncAttendanceFromSheet = async () => {
  if (syncRunning) {
    console.log(
      "Attendance sync skipped because a previous sync is still running."
    );
    return null;
  }

  syncRunning = true;

  try {
    const result = await attendanceService.importAttendance();

    if (result.insertedRows > 0 || result.matchedRows > 0) {
      console.log(
        `Attendance synced. Total sheet rows: ${result.totalRows}, inserted: ${result.insertedRows}, matched existing: ${result.matchedRows}, already synced: ${result.skippedRows}`
      );
    }

    return result;
  } catch (error) {
    console.error(
      "Attendance sync failed:",
      error.message
    );

    return null;
  } finally {
    syncRunning = false;
  }
};

const autoCheckoutEmployees = async () => {
  try {
    console.log("Running auto checkout job...");

    await attendanceService.autoCheckoutEmployees();

    console.log("Auto checkout completed.");
  } catch (error) {
    console.error(
      "Auto checkout failed:",
      error.message
    );
  }
};

const finalizeDailyAttendanceSummaries = async () => {
  if (summaryRunning) {
    console.log(
      "Daily attendance summary skipped because a previous run is still active."
    );
    return null;
  }

  summaryRunning = true;

  try {
    const result =
      await attendanceCalculator.generateDailyAttendanceSummaries();

    console.log(
      `Attendance summaries completed for ${result.attendanceDate}. Users processed: ${result.processedUsers}.`
    );

    return result;
  } catch (error) {
    console.error(
      "Daily attendance summary failed:",
      error.message
    );

    return null;
  } finally {
    summaryRunning = false;
  }
};

const startAttendanceScheduler = () => {
  console.log(
    "Attendance scheduler started. Syncing Google Sheet every 30 seconds."
  );

  // Existing Google Sheet sync
  cron.schedule(
    "*/30 * * * * *",
    syncAttendanceFromSheet,
    { timezone: PAKISTAN_TIME_ZONE }
  );

  // Auto checkout every day at 11:59 PM
  cron.schedule(
    "59 23 * * *",
    autoCheckoutEmployees,
    { timezone: PAKISTAN_TIME_ZONE }
  );

  // Finalize the previous day after auto checkout has completed.
  cron.schedule(
    "0 0 * * *",
    finalizeDailyAttendanceSummaries,
    { timezone: PAKISTAN_TIME_ZONE }
  );
};

module.exports = {
  finalizeDailyAttendanceSummaries,
  startAttendanceScheduler,
  syncAttendanceFromSheet,
};
